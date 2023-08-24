const fs = require('fs');
const j2cp = require('json2csv').Parser;
const axios = require('axios');
const cheerio = require('cheerio');

const searchKeyword =
  'Blockchain&location=Worldwide&locationId=&geoId=92000000&f_TPR=r86400';
const URL = `https://www.linkedin.com/jobs/blockchain-jobs-worldwide?keywords=${searchKeyword}&position=1&pageNum=0&start=0`;

let items = [];

let perPage = 25;
let hasNextData = true;

const createCSV = (books_data) => {
  const parser = new j2cp();
  const csv = parser.parse(books_data);
  fs.writeFileSync('./jobs.csv', csv);
};
const getData = async () => {
  try {
    const response = await axios.get(URL);
    const cheerio_data = await cheerio.load(response.data);
    // console.log(cheerio_data('.results-context-header__job-count')?.text());
    let jobs = cheerio_data('.jobs-search__results-list li');

    jobs?.each(function () {
      title = cheerio_data(this)
        .find('.base-search-card__info  h3')
        .text()
        ?.replace(/^\s+|\s+$/g, '');

      company_name = cheerio_data(this)
        .find('.base-search-card__info h4 a')
        .text()
        ?.replace(/^\s+|\s+$/g, '');

      location = cheerio_data(this)
        .find('.job-search-card__location')
        .text()
        ?.replace(/^\s+|\s+$/g, '');

      job_posted_date = cheerio_data(this)
        .find('time')
        .text()
        ?.replace(/^\s+|\s+$/g, '');
      job_link = cheerio_data(this).find('.base-card__full-link')?.attr('href');
      items.push({ title, company_name, location, job_posted_date, job_link });
    });
  } catch (error) {
    // console.log(error);
  }
};
const loadMoreData = async () => {
  try {
    const load_more_url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/${searchKeyword}?start=${perPage}`;
    await axios
      .get(load_more_url)
      ?.then(async (response) => {
        if (response?.data) {
          console.log('data fetched', perPage);
          perPage = perPage + 25;
          const cheerio_data = await cheerio.load(response.data);
          let jobs = cheerio_data('li');
          jobs?.each(function () {
            title = cheerio_data(this)
              .find('.base-search-card__info  h3')
              .text()
              ?.replace(/^\s+|\s+$/g, '');

            company_name = cheerio_data(this)
              .find('.base-search-card__info h4 a')
              .text()
              ?.replace(/^\s+|\s+$/g, '');

            location = cheerio_data(this)
              .find('.job-search-card__location')
              .text()
              ?.replace(/^\s+|\s+$/g, '');

            job_posted_date = cheerio_data(this)
              .find('time')
              .text()
              ?.replace(/^\s+|\s+$/g, '');
            job_link = cheerio_data(this)
              .find('.base-card__full-link')
              ?.attr('href');
            const payload = {
              title: title,
              company_name: company_name,
              location: location,
              job_posted_date: job_posted_date,
              job_link: job_link,
            };
            items.push(payload);
          });
        } else {
          console.log('no data');
          hasNextData = false;
        }
      })
      .catch((err) => {
        // console.log(err);
        hasNextData = false;
      });
  } catch (error) {
    console.log(error);
    hasNextData = false;
  }
};
const loadMethods = async () => {
  await getData();
  while (hasNextData) {
    await loadMoreData();
  }
  createCSV(items);
};

loadMethods();
