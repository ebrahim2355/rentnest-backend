import { IncomingMessage, ServerResponse } from "http";

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
        }
    }
}

const saveRawBody = (req: IncomingMessage & { rawBody?: Buffer }, res: ServerResponse, buffer: Buffer) => {
    req.rawBody = buffer;
};

export default saveRawBody;
