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

// Atualiza a estrutura do banco de dados para a nova lógica
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            group_id INTEGER
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            group_id INTEGER
        )
    `);
    
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
            due_date TEXT,
            confirmed_at TEXT DEFAULT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        )
    `);

    // Altera a tabela de usuários para adicionar a coluna group_id se ela não existir
    db.all(`PRAGMA table_info(users)`, (err, tableInfo) => {
        if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(col => col.name === 'group_id')) {
            db.run(`ALTER TABLE users ADD COLUMN group_id INTEGER`, (err) => {
                if (err) {
                    console.error('Erro ao adicionar group_id na tabela users:', err.message);
                }
            });
        }
    });

    // Altera a tabela de contas para adicionar a coluna group_id e remover user_id
    db.all(`PRAGMA table_info(accounts)`, (err, tableInfo) => {
        if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(col => col.name === 'group_id')) {
            db.run(`ALTER TABLE accounts ADD COLUMN group_id INTEGER`, (err) => {
                if (err) {
                    console.error('Erro ao adicionar group_id na tabela accounts:', err.message);
                }
            });
            // Opcional: remover a coluna user_id se ela existir. Para simplificar, não faremos isso agora.
        }
    });
    
    // Altera a tabela de transações para adicionar as colunas se elas não existirem
    const transactionColumns = ['original_account_name', 'is_confirmed', 'created_at', 'due_date', 'confirmed_at'];
    transactionColumns.forEach(col => {
        db.all(`PRAGMA table_info(transactions)`, (err, tableInfo) => {
            if (!tableInfo || !Array.isArray(tableInfo) || !tableInfo.some(c => c.name === col)) {
                db.run(`ALTER TABLE transactions ADD COLUMN ${col} TEXT`, (err) => {
                    if (err) {
                        console.error(`Erro ao adicionar a coluna ${col} em transactions:`, err.message);
                    }
                });
            }
        });
    });

    // Insere um usuário de exemplo se não existir
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
        if (!row) {
            bcrypt.hash('123456', SALT_ROUNDS, (err, hash) => {
                if (err) throw err;
                const groupId = 1; // Cria o primeiro grupo para o admin
                db.run(`INSERT INTO users (username, password, group_id) VALUES (?, ?, ?)`, ['admin', hash, groupId], (err) => {
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

const authenticate = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const groupId = req.headers['x-group-id'];
    
    console.log('--- Auth Middleware ---');
    console.log('Recebido User ID:', userId);
    console.log('Recebido Group ID:', groupId);

    if (!userId || !groupId) {
        console.log('Autenticação falhou: userId ou groupId ausentes.');
        return res.status(401).json({ message: 'Não autorizado' });
    }
    req.userId = userId;
    req.groupId = groupId;
    console.log('Autenticação bem-sucedida.');
    next();
};

// --- ROTAS DA API ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            return res.json({ message: 'Login bem-sucedido', userId: user.id, groupId: user.group_id });
        } else {
            return res.status(400).json({ message: 'Usuário ou senha inválidos' });
        }
    });
});

app.post('/api/users/add', authenticate, (req, res) => {
    const { username, password } = req.body;
    const groupId = req.groupId;

    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao criar usuário', error: err.message });
        }
        db.run(`INSERT INTO users (username, password, group_id) VALUES (?, ?, ?)`, [username, hash, groupId], (err) => {
            if (err) {
                return res.status(400).json({ message: 'Usuário já existe ou erro no banco.', error: err.message });
            }
            res.status(201).json({ message: 'Novo usuário adicionado ao grupo com sucesso.' });
        });
    });
});

app.get('/api/users/list', authenticate, (req, res) => {
    const groupId = req.groupId;
    db.all(`SELECT id, username FROM users WHERE group_id = ?`, [groupId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
        }
        res.json(rows);
    });
});

app.post('/api/accounts', authenticate, (req, res) => {
    const { name } = req.body;
    const groupId = req.groupId;
    db.run(`INSERT INTO accounts (group_id, name) VALUES (?, ?)`, [groupId, name], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao criar conta', error: err.message });
        }
        res.status(201).json({ id: this.lastID, name });
    });
});

app.get('/api/accounts', authenticate, (req, res) => {
    const groupId = req.groupId;
    
    console.log('--- GET /api/accounts ---');
    console.log('Buscando contas para o Group ID:', groupId);

    db.all(`SELECT * FROM accounts WHERE group_id = ?`, [groupId], (err, rows) => {
        if (err) {
            console.error('Erro no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar contas', error: err.message });
        }
        res.json(rows);
    });
});

app.delete('/api/accounts/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { new_account_id, original_account_name } = req.body;
    const groupId = req.groupId;

    if (parseInt(id) === parseInt(new_account_id)) {
        return res.status(400).json({ message: 'Não é possível transferir transações para a mesma conta.' });
    }

    db.get(`SELECT COUNT(*) as count FROM accounts WHERE group_id = ?`, [groupId], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao verificar contas', error: err.message });
        }
        if (row.count <= 1) {
            return res.status(400).json({ message: 'Não é possível deletar a única conta existente.' });
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            db.run(`UPDATE transactions SET account_id = ?, original_account_name = ? WHERE account_id = ?`,
                [new_account_id, original_account_name, id],
                function(err) {
                    if (err) {
                        db.run("ROLLBACK;");
                        return res.status(500).json({ message: 'Erro ao transferir transações', error: err.message });
                    }
                    db.run(`DELETE FROM accounts WHERE id = ? AND group_id = ?`, [id, groupId], function(err) {
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

app.post('/api/transactions', authenticate, (req, res) => {
    const { description, amount, type, account_id, due_date } = req.body;
    const userId = req.userId;
    if (!account_id) {
        return res.status(400).json({ message: 'O ID da conta é obrigatório.' });
    }
    db.run(`INSERT INTO transactions (user_id, account_id, description, amount, type, due_date) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, account_id, description, amount, type, due_date],
        function (err) {
            if (err) {
                return res.status(500).json({ message: 'Erro ao adicionar transação', error: err.message });
            }
            res.status(201).json({ id: this.lastID, description, amount, type, account_id, due_date, created_at: new Date().toISOString() });
        }
    );
});

app.put('/api/transactions/:id/confirm', authenticate, (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    
    console.log('--- PUT /api/transactions/:id/confirm ---');
    console.log('Confirmando transação com ID:', id);
    console.log('User ID do header:', userId);

    db.run(`UPDATE transactions SET is_confirmed = 1, confirmed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
        [id, userId],
        function(err) {
            if (err) {
                console.error('Erro no banco de dados:', err.message);
                return res.status(500).json({ message: 'Erro ao confirmar transação', error: err.message });
            }
            if (this.changes === 0) {
                console.log('Transação não encontrada ou sem permissão.');
                return res.status(404).json({ message: 'Transação não encontrada ou sem permissão' });
            }
            console.log('Transação confirmada com sucesso.');
            res.status(200).json({ message: 'Transação confirmada com sucesso' });
        }
    );
});

app.get('/api/transactions', authenticate, (req, res) => {
    const groupId = req.groupId;
    
    console.log('--- GET /api/transactions ---');
    console.log('Buscando transações para o Group ID:', groupId);

    db.all(`
        SELECT t.*, a.name as account_name, u.username as creator_name
        FROM transactions t
        LEFT JOIN accounts a ON t.account_id = a.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE a.group_id = ?
        ORDER BY t.id DESC
    `, [groupId], (err, rows) => {
        if (err) {
            console.error('Erro no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar transações', error: err.message });
        }
        rows.forEach(row => {
            if (!row.account_name && row.original_account_name) {
                row.account_name = row.original_account_name + ' (Excluída)';
            }
        });
        res.json(rows);
    });
});

app.get('/api/accounts', authenticate, (req, res) => {
    const groupId = req.groupId;
    
    console.log('--- GET /api/accounts ---');
    console.log('Buscando contas para o Group ID:', groupId);

    db.all(`SELECT * FROM accounts WHERE group_id = ?`, [groupId], (err, rows) => {
        if (err) {
            console.error('Erro no banco de dados:', err.message);
            return res.status(500).json({ message: 'Erro ao buscar contas', error: err.message });
        }
        res.json(rows);
    });
});


app.put('/api/transactions/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { description, amount, type, account_id, due_date } = req.body;
    const userId = req.userId;
    db.run(`UPDATE transactions SET description = ?, amount = ?, type = ?, account_id = ?, due_date = ? WHERE id = ? AND user_id = ?`,
        [description, amount, type, account_id, due_date, id, userId],
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

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});