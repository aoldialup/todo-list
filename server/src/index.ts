import express, { Response, Request } from "express";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import "dotenv/config";

const { PORT, ACCESS_TOKEN_SECRET, REFRESH_TOKEN } = process.env;

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

export function credentialsValid(username: string, password: string) {
  return USER_REGEX.test(username) && PWD_REGEX.test(password);
}

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "todo_list",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

const app = express();
app.use(express.json());
app.use(cors());

const accountRouter = express.Router();
app.use("/accounts", accountRouter);

const todoRouter = express.Router();
app.use("/todos", todoRouter);

function getUserId(req: Request) {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded: any = jwt.verify(token!, ACCESS_TOKEN_SECRET as string);
  const userId = decoded.id;

  return userId;
}

async function generatePassword(plainText: string) {
  const salt = await bcrypt.genSalt();
  const hash = await bcrypt.hash(plainText, salt);

  return hash;
}

function generateToken(userId: number) {
  return jwt.sign({ id: userId }, ACCESS_TOKEN_SECRET as string, {
    expiresIn: "1h",
  });
}

todoRouter.use((req: any, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET as string, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    next();
  });
});

accountRouter.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!credentialsValid(username, password)) {
    return res.sendStatus(400);
  }

  try {
    const hash = await generatePassword(password);

    connection.query(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hash],
      (err, result: any) => {
        if (err) {
          if (err.errno === 1062) {
            return res.sendStatus(409);
          }

          return res.sendStatus(500);
        }

        connection.query(
          "SELECT LAST_INSERT_ID() as user_id",
          [],
          (err, result: any) => {
            const token = generateToken(result[0].user_id);
            res.status(201).json({ token });
          }
        );
      }
    );
  } catch (err) {
    res.sendStatus(500);
  }
});

accountRouter.post("/login", async (req: any, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.sendStatus(400);
  } 

  connection.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results: any) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      } else if (results.length === 0) {
        res.sendStatus(401);
      } else {
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (isMatch) {
          const token = generateToken(user.user_id);
          res.json({ token });
        } else {
          res.sendStatus(401);
        }
      }
    }
  );
});

todoRouter.put("/:id", (req: any, res) => {
  const userId = getUserId(req);
  const todoId = req.params.id;
  const { text } = req.body;

  connection.query(
    "UPDATE todos SET text = ? WHERE todo_id = ? AND user_id = ?",
    [text, todoId, userId],
    (err, result: any) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update todo" });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).json({ error: "Todo not found" });
        } else {
          res.json({ message: "Todo updated successfully" });
        }
      }
    }
  );
});

todoRouter.delete("/:id", (req: any, res) => {
  const userId = getUserId(req);
  const todoId = req.params.id;

  // Delete todo from MySQL database
  connection.query(
    "DELETE FROM todos WHERE todo_id = ? AND user_id = ?",
    [todoId, userId],
    (err, result: any) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete todo" });
      } else {
        if (result.affectedRows === 0) {
          res.status(404).json({ error: "Todo not found" });
        } else {
          res.json({ message: "Todo deleted successfully" });
        }
      }
    }
  );
});

// Add new todo endpoint
todoRouter.get("/", (req: any, res) => {
  const userId = getUserId(req);

  connection.query(
    "select * from todos where user_id=(?)",
    [userId],
    (err, result: any) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to retrieve" });
      } else {
        res.json({
          result,
          message: "Successfully retrieved todos",
        });
      }
    }
  );
});

todoRouter.post("/", (req: any, res) => {
  const userId = getUserId(req);

  connection.query(
    "INSERT INTO todos (text, user_id) VALUES (?, ?)",
    ["", userId],
    (err, result: any) => {
      if (err) {
        res.status(500).json({ error: "Failed to add todo" });
      } else {
        res.json({
          todoId: result.insertId,
          message: "Todo added successfully",  
        });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
