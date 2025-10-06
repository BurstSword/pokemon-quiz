const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


async function fetchData(url) {
    try {
        const result = await axios.get(url);
        return cheerio.load(result.data);
    } catch (error) {
        console.error(`Failed to fetch data from ${url}: ${error.message}`);
        return null;
    }
}

async function scrapeWebpage() {
    const json = fs.readFileSync('./src/assets/pokemon.json', 'utf8');

    // Parse the JSON file to a JavaScript object
    const obj = JSON.parse(json);

    // Create an array to store the new data
    const newDataArray = [];

    for (let i = 0; i < obj.length; i++) {
        const url = `https://pokemon.gameinfo.io/en/pokemon/${obj[i].Number}-${obj[i].Name}`;
        const $ = await fetchData(url);

        if ($) {
            const elements = $('.description');

            const data = elements[1].children[0].data || "";

            const newData = {
                "Number": obj[i].Number,
                "Name": obj[i].Name,
                "Generation": obj[i].Generation,
                "Legendary": obj[i].Legendary,
                "Image": obj[i].Image,
                "Type1": obj[i].Type1,
                "Type2": obj[i].Type2,
                "Description": data,
            };

            newDataArray.push(newData);
        }
    }

   
    const existingDataJson = fs.readFileSync('./src/assets/newPokedex.json', 'utf8');
    const existingData = JSON.parse(existingDataJson);

   
    const allData = existingData.concat(newDataArray);

    
    const allDataJson = JSON.stringify(allData, null, 2);

    
    fs.writeFileSync('./src/assets/newPokedex.json', allDataJson, 'utf8');

    console.log(allData);
}

scrapeWebpage();