import { once } from "node:events";
import { DEFAULT_HEADER } from "../util/util.js";

function tipRoutes({ tipService, authService }) {
  
  const verifyUser = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.writeHead(401, DEFAULT_HEADER);
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return null;
    }

    try {
      const user = await authService.verify(token);
      return user;
    } catch (err) {
      res.writeHead(401, DEFAULT_HEADER);
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return null;
    }
  };

  return {
    "/tips:get": async (req, res) => {
      const user = await verifyUser(req, res);
      if (!user) return;

      const tips = await tipService.findAll();

      res.writeHead(200, DEFAULT_HEADER);
      return res.end(
        JSON.stringify({
          results: tips,
          currentUserId: user.userId,
        })
      );
    },

    "/tips:post": async (req, res) => {
      const user = await verifyUser(req, res);
      if (!user) return;

      const [rawBody] = await once(req, "data");
      const body = JSON.parse(rawBody || "{}");
      const { title } = body;

      if (!title) {
        res.writeHead(400, DEFAULT_HEADER);
        return res.end(JSON.stringify({ error: "title is required" }));
      }

      const id = await tipService.create({
        title,
        userId: user.userId,
      });

      res.writeHead(201, DEFAULT_HEADER);
      return res.end(
        JSON.stringify({
          id,
          success: "Tip created successfully",
        })
      );
    },

    "/tips:put": async (req, res) => {
      const user = await verifyUser(req, res);
      if (!user) return;

      const [rawBody] = await once(req, "data");
      const body = JSON.parse(rawBody || "{}");
      const { id, title } = body;

      if (!id || !title) {
        res.writeHead(400, DEFAULT_HEADER);
        return res.end(JSON.stringify({ error: "id and title are required" }));
      }

      const ok = await tipService.update({
        id,
        title,
        userId: user.userId,
      });

      if (!ok) {
        res.writeHead(404, DEFAULT_HEADER);
        return res.end(JSON.stringify({ error: "Tip not found or not yours" }));
      }

      res.writeHead(200, DEFAULT_HEADER);
      return res.end(JSON.stringify({ success: "Tip updated successfully" }));
    },

    "/tips:delete": async (req, res) => {
      const user = await verifyUser(req, res);
      if (!user) return;

      const [rawBody] = await once(req, "data");
      const body = JSON.parse(rawBody || "{}");
      const { id } = body;

      if (!id) {
        res.writeHead(400, DEFAULT_HEADER);
        return res.end(JSON.stringify({ error: "id is required" }));
      }

      const ok = await tipService.remove({
        id,
        userId: user.userId,
      });

      if (!ok) {
        res.writeHead(404, DEFAULT_HEADER);
        return res.end(JSON.stringify({ error: "Tip not found or not yours" }));
      }

      res.writeHead(200, DEFAULT_HEADER);
      return res.end(JSON.stringify({ success: "Tip deleted successfully" }));
    },
  };
}

export default tipRoutes;