import extractVoiceActor from "../extractors/actors.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

const getVoiceActor = async (req, res) => {
  const id = req.params.id;
  const cacheKey = `voiceActor_${id}`;

  try {
    // 1) Try reading cache
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT → voiceActor", id);
      return res.json(cachedData);
    }

    // 2) Fetch real voice actor details
    const voiceActorData = await extractVoiceActor(id);

    // Validate response format
    if (
      !voiceActorData ||
      !voiceActorData.results ||
      !voiceActorData.results.data ||
      voiceActorData.results.data.length === 0
    ) {
      return res.status(404).json({ error: "No voice actor found." });
    }

    // 3) Save result into cache
    setCachedData(cacheKey, voiceActorData).catch((err) => {
      console.error("Failed to cache voice actor:", err);
    });

    console.log("CACHE MISS → stored voiceActor", id);

    // Return normal response
    return res.json(voiceActorData);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export default getVoiceActor;
