import express from "express"
import cors from "cors"
import {config} from "dotenv"
import { authRoutes } from "./routes/auth";
import bodyParser from "body-parser";
import { errorHandler } from "./utils/utils";
import { authMiddleware } from "./middlewares/authMiddleware";
import { userRoutes } from "./routes/user";
import morgan from "morgan"
import { logger } from "./utils/logger";
config()

const app = express();
const port = process.env.PORT || 8000;

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

app.use(cors({
    origin: '*'
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes)

app.use("/user", authMiddleware, userRoutes)

app.get('/', (req, res) => {
    res.send('Hi');
});

app.use(errorHandler)

app.listen(port, async () => {
    logger.info(`Server is running at port ${port}`);
});