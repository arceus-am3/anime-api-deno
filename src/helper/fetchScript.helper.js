import axios from "npm:axios@1.6.7";

async function fetchScript(url) {
  const response = await axios.get(url);
  return response.data;
}

export default fetchScript;
