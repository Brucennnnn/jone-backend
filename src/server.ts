import { createApp } from "./app.js";
import { createScamAnalysisService } from "./analysis/scamAnalysisService.js";
import { loadConfig } from "./config.js";
import { OllamaClient } from "./ollama.js";

const config = loadConfig();
const ollamaClient = OllamaClient.fromConfig(config);
const app = createApp(config, {
  ollamaClient,
  analysisService: createScamAnalysisService(ollamaClient)
});

app.listen(config.port, config.host, () => {
  console.log(
    `Jone backend listening on http://${config.host}:${config.port}`
  );
});
