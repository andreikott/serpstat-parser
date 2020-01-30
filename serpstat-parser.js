const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch(
    {
      // headless: false
    }
  );
  const page = await browser.newPage();
  await page.goto('https://serpstat.com/domains/?query=microsoft.com&se=g_us&search_type=subdomains');
  await page.click('button[name=yt0]');

  try {
    await page.waitFor('.dashboard_stat_visibility', { timeout: 5000 });

    console.log('Parsing started!');

    var visibility = await page.evaluate(element => element.textContent, await page.$('.dashboard_stat_visibility > .dtc > .dashboard_stat_num'));

    var keywords = await page.evaluate(element => element.textContent, await page.$('.dashboard_stat_organic > .dtc > .dashboard_stat_num'));

    const trafficScript = await page.evaluate(element => element.textContent, await page.$('#traff_card > .card_body > script'));
    var trafficDates = JSON.parse(trafficScript.split("{'show':false},'data':").pop().split("}],'yAxis'")[0].replace(/\\x20/g, " ").replace(/'/g, '"'));
    var trafficValues = JSON.parse(trafficScript.split("'type':'line','data':").pop().split(",'markLine'")[0].replace(/\\/g, "\\\\").replace(/'/g, '"'));

    var trafficArray = [],
        i;
    for (i = 0; i < trafficValues.length; i++) {
        var trafficObject = {};
        trafficObject['value'] = trafficValues[i]['value'];
        trafficObject['date'] = trafficDates[i];
        trafficArray.push(trafficObject);
    }

    var genericArray = {
      'keywords': keywords.replace(/[^0-9.]/g, ''),
      'traffic': trafficArray,
      'visibility': visibility.replace(/[^0-9.]/g, ''),
    }

    console.log(genericArray);

    await browser.close();

    console.log('Parsing finished!');

    fs.writeFile(`${__dirname}/serpstat-${new Date().getTime()}.json`, JSON.stringify(genericArray), function(err) {
      if(err) {
          return console.log(err);
      }
      console.log(`${__dirname}/serpstat-${new Date().getTime()}.json was saved!`);
    });

  } catch {
    console.log('Change your IP address for parsing!');
    await browser.close();
  }

})();
