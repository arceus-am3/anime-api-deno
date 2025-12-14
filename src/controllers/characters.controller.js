import extractCharacter from "../extractors/characters.extractor.js";
import { getCachedData, setCachedData } from "../helper/cache.helper.js";

const getCharacter = async (req, res) => {
  const id = req.params.id;
  const cacheKey = `character_${id}`;

  try {
    // 1️⃣ Try cache first
    const cachedData = await getCachedData(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT → character", id);
      return res.json(cachedData);
    }

    // 2️⃣ Fetch fresh
    const characterData = await extractCharacter(id);

    // Validate data
    if (
      !characterData ||
      !characterData.results ||
      !characterData.results.data ||
      characterData.results.data.length === 0
    ) {
      return res.status(404).json({ error: "Character not found." });
    }

    // 3️⃣ Save response in cache
    setCachedData(cacheKey, characterData).catch((err) => {
      console.error("Failed to cache character data:", err);
    });

    console.log("CACHE MISS → stored character", id);

    return res.json(characterData);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export default getCharacter;
