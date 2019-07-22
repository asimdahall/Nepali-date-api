let puppeteer = require("puppeteer");
let $ = require("cheerio");
let fs = require("fs");
const url = "https://www.ashesh.com.np/nepali-calendar/";

const START_YEAR = 1970;
const END_YEAR = 2078;
const MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra"
];
const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
let page, browser;

let finalData = [];
(async function() {
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
  await page.goto(url, { timeout: 30000000 });
  for (let year = START_YEAR; year < END_YEAR; year++) {
    let y = [];
    for (let i = 0; i < MONTHS.length; i++) {
      let m = await scrapData({ year: year, month: MONTHS[i] });
      y = [...y, m];
    }
    fs.writeFile(`${year}.json`, JSON.stringify({ [year]: y }, null, 1), e => {
      if (e) console.log(e);
    });
    finalData = [...finalData, { [year]: y }];
  }
  fs.writeFile("nepalidata.json", JSON.stringify(finalData, null, 1), err => {
    if (err) console.log(err);
    console.log("Successfully Written to File.");
  });
})();

async function scrapData({ year, month }) {
  try {
    let m = [];
    console.log({ year, month });
    await Promise.all([
      page.click("input[value=Go]"),
      page.waitForNavigation({ timeout: 200000000 })
    ]);

    await page.select("#year", String(year));
    await page.select("#month", month);
    //   await page.keyboard.press("Enter");

    let html = await page.content();

    $(".cal_left", html).each(function() {
      let [month, year] = $(this)
        .text()
        .split(" ");
    });
    let index = 0;
    $("#calendartable tr", html).each((i, e) => {
      if (i !== 0 && i !== 1) {
        $(e)
          .find("td")
          .each((i, el) => {
            let ind = i;
            let tithi = $(el)
              .find(".tithi")
              .text();
            let date_np = $(el)
              .find(".date_np")
              .text();

            let date_en = $(el)
              .find(".date_en")
              .text();

            m = [
              ...m,
              {
                tithi,
                date_np,
                date_en,
                day: DAYS[i]
              }
            ];
            index += 1;
          });
      }
    });
    return { [month]: m };
  } catch (e) {
    console.log({ e });
  }
}
