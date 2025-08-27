const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// Configura o middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conecta ao banco de dados ou cria um novo arquivo se não existir
const db = new sqlite3.Database('financas.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Conectado ao banco de dados SQLite.');
});

// Cria as tabelas se elas não existirem
db.serialize(() => {
    // Tabela para o usuário
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // Tabela para contas bancárias
    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Tabela para as transações, com novas colunas
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            account_id INTEGER,
            description TEXT,
            amount REAL,
            type TEXT,
            original_account_name TEXT,
            is_confirmed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        )
    `);

    // Insere um usuário de exemplo se não existir
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
        if (!row) {
            bcrypt.hash('sua-senha-aqui', SALT_ROUNDS, (err, hash) => {
                if (err) throw err;
                db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hash], (err) => {
                    if (err) {
                        console.error('Erro ao inserir usuário padrão:', err.message);
                    } else {
                        console.log('Usuário padrão "admin" criado com sucesso.');
                    }
                });
            });
        }
    });
});

// Autenticação de usuário (middleware)
const authenticate = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ message: 'Não autorizado' });
    }
    req.userId = userId;
    next();
};

// --- ROTAS DA API ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            return res.json({ message: 'Login bem-sucedido', userId: user.id });
        } else {
            return res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    });
});

// Contas: Criar uma nova conta
app.post('/api/accounts', authenticate, (req, res) => {
    const { name } = req.body;
    const userId = req.userId;
    db.run(`INSERT INTO accounts (user_id, name) VALUES (?, ?)`, [userId, name], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao criar conta', error: err.message });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});

// Contas: Listar contas do usuário
app.get('/api/accounts', authenticate, (req, res) => {
    const userId = req.userId;
    db.all(`SELECT * FROM accounts WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar contas', error: err.message });
        }
        res.json(rows);
    });
});

// Contas: Deletar uma conta e transferir suas transações
app.delete('/api/accounts/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { new_account_id, original_account_name } = req.body;
    const userId = req.userId;

    if (parseInt(id) === parseInt(new_account_id)) {
        return res.status(400).json({ message: 'Não é possível transferir transações para a mesma conta.' });
    }

    db.get(`SELECT COUNT(*) as count FROM accounts WHERE user_id = ?`, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao verificar contas', error: err.message });
        }
        if (row.count <= 1) {
            return res.status(400).json({ message: 'Não é possível deletar a única conta existente.' });
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");

            // Atualiza as transações para a nova conta e salva o nome da conta original
            db.run(`UPDATE transactions SET account_id = ?, original_account_name = ? WHERE account_id = ? AND user_id = ?`,
                [new_account_id, original_account_name, id, userId],
                function(err) {
                    if (err) {
                        db.run("ROLLBACK;");
                        return res.status(500).json({ message: 'Erro ao transferir transações', error: err.message });
                    }
                    // Deleta a conta antiga
                    db.run(`DELETE FROM accounts WHERE id = ? AND user_id = ?`, [id, userId], function(err) {
                        if (err) {
                            db.run("ROLLBACK;");
                            return res.status(500).json({ message: 'Erro ao deletar conta', error: err.message });
                        }
                        if (this.changes === 0) {
                            db.run("ROLLBACK;");
                            return res.status(404).json({ message: 'Conta não encontrada ou sem permissão' });
                        }
                        db.run("COMMIT;", (err) => {
                            if (err) {
                                return res.status(500).json({ message: 'Erro ao finalizar transação', error: err.message });
                            }
                            res.status(200).json({ message: 'Conta deletada e transações transferidas com sucesso.' });
                        });
                    });
                }
            );
        });
    });
});

// Transações: Adicionar uma nova transação
app.post('/api/transactions', authenticate, (req, res) => {
    const { description, amount, type, account_id } = req.body;
    const userId = req.userId;
    if (!account_id) {
        return res.status(400).json({ message: 'O ID da conta é obrigatório.' });
    }
    db.run(`INSERT INTO transactions (user_id, account_id, description, amount, type) VALUES (?, ?, ?, ?, ?)`,
        [userId, account_id, description, amount, type],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao adicionar transação', error: err.message });
            }
            res.status(201).json({ id: this.lastID, description, amount, type, account_id });
        }
    );
});

// Transações: Rota para confirmar uma transação
app.put('/api/transactions/:id/confirm', authenticate, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;

    db.run(`UPDATE transactions SET is_confirmed = 1 WHERE id = ? AND user_id = ?`,
        [id, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao confirmar transação', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
            }
            res.status(200).json({ message: 'Transação confirmada com sucesso' });
        }
    );
});


// Transações: Listar todas as transações do usuário (agrupando por conta)
app.get('/api/transactions', authenticate, (req, res) => {
    const userId = req.userId;
    db.all(`
        SELECT t.*, a.name as account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.user_id = ?
        ORDER BY t.id DESC
    `, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar transações', error: err.message });
        }
        // Se a conta de origem foi deletada, o nome da conta original será usado.
        rows.forEach(row => {
            if (!row.account_name && row.original_account_name) {
                row.account_name = row.original_account_name + ' (Excluída)';
            }
        });
        res.json(rows);
    });
});

// Transações: Buscar uma única transação
app.get('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    db.get(`
        SELECT t.*, a.name as account_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        WHERE t.id = ? AND t.user_id = ?
    `, [id, userId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar transação', error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Transação não encontrada' });
        }
        // Se a conta de origem foi deletada, o nome da conta original será usado.
        if (!row.account_name && row.original_account_name) {
            row.account_name = row.original_account_name + ' (Excluída)';
        }
        res.json(row);
    });
});

// Transações: Atualizar uma transação
app.put('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { description, amount, type, account_id } = req.body;
    const userId = req.userId;
    db.run(`UPDATE transactions SET description = ?, amount = ?, type = ?, account_id = ? WHERE id = ? AND user_id = ?`,
        [description, amount, type, account_id, id, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao atualizar transação', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
            }
            res.status(200).json({ message: 'Transação atualizada com sucesso' });
        }
    );
});

// Transações: Deletar uma transação
app.delete('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    db.run(`DELETE FROM transactions WHERE id = ? AND user_id = ?`, [id, userId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar transação', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
        }
        res.status(200).json({ message: 'Transação deletada com sucesso' });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});