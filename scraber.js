const puppeteer = require('puppeteer');
const sleep = require('await-sleep');
const fs = require('fs-extra');

const reportId = "pQtgP2q3NDRb7XFz";
const date = new Date("Wed Oct 23 2019 19:30 GMT+2");
const fileName = date.toISOString().replace(/:/g, "").replace(/\./g, "");

console.log(fileName);

(async () => {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    const url = `https://classic.warcraftlogs.com/reports/${reportId}#boss=-2&difficulty=0&type=summary`;
    await page.goto(url, {waitUntil: 'load'});

    const sources = await page.evaluate(() => {
        const sources = new Map();
        const entries = document.getElementsByClassName("composition-entry");
        for (let i = 0, entry; entry = entries[i]; i++) {
            const reportLink = entry.childNodes[1].outerHTML;
            const { groups: { sourceId } } =/onclick.*?1,(?<sourceId>.*?),0,0/.exec(reportLink);
            const clazz = entry.childNodes[1].classList[0];
            const charName = entry.childNodes[1].innerText;

            sources.set(charName, {
                sourceId: sourceId,
                charName: charName,
                clazz: clazz
            });
        }
        return Array.from(sources.values());
    });
    await browser.close();

    for (const source of sources) {
        const sourceId = source.sourceId;
        const clazz = source.clazz;
        const charName = source.charName;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const url = `https://classic.warcraftlogs.com/reports/${reportId}#boss=-2&difficulty=0&source=${sourceId}&type=summary`;
        await page.goto(url, {waitUntil: 'load'});

        await sleep(2000);

        try {
            const items = await page.evaluate(() => {
                const items = [];
                const table = document.getElementById("summary-gear-0");
                const body = table.tBodies[0];

                for (let i = 0, row; row = body.rows[i]; i++) {
                    const ilvl = row.cells[0].innerText;

                    const slot = row.cells[1].innerText.replace("Tabard", "Ranged");
                    const name = row.cells[2].innerText;
                    const rarity = row.cells[2].childNodes[1].classList[0];
                    const matches =/ench=(?<enchant>.*)\;/.exec(row.cells[2].childNodes[1].rel);
                    const enchant = matches && matches[1]? matches[1] : null;
                    const wowheadLink = row.cells[2].childNodes[1].href;
                    const { groups: { itemId } } =/item=(?<itemId>.*)/.exec(wowheadLink);
                    items.push({itemId, name, rarity, slot, enchant, ilvl});
                }
                return items;
            });

            const char = {
                charName: charName,
                clazz: clazz,
                items: items
            };
            if (items.length > 0) {
                fs.appendFileSync(`${fileName}.jsonl`, JSON.stringify(char) + "\n");
                console.log(`Wrote ${charName} ${sourceId}`);
            } else {
                console.log(`Dismissed ${sourceId}`);
            }

        } catch (e) {
            console.log(url);
            console.log(e);
        } finally {
            await browser.close();
        }
    }
})();
