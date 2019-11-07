const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async () => {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    const url = `https://classic.warcraftlogs.com/guild/attendance/477300`;
    await page.goto(url, {waitUntil: 'networkidle2', timeout: 0});

    page.on('console', consoleObj => console.log(consoleObj.text()));

    const characters = await page.evaluate(() => {
        const characters = new Map();

        const table = document.getElementById("attendance-table");
        const thead = table.tHead;
        const theadRow = thead.childNodes[1];
        const tbody = table.tBodies[0];

        for (let i = 0; i < theadRow.childNodes.length; i++) {
            const cell = theadRow.childNodes[i];
            console.log(cell.innerText);
            console.log('--');
        }

        for (let i = 1; i < tbody.childNodes.length; i++) {
            const row = tbody.childNodes[i];
            const charname = row.childNodes[0].innerText;
            //console.log(charname);
            characters.set(charname, []);


        }
        return characters;
    });

    console.log(characters);

    await browser.close();
})();
