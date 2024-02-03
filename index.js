const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const bot = new TelegramBot('6692056287:AAGnM6Bmcw36JLAh1x29-z_Qj_aFsbxCW5w', { polling: true });

// Replace 'YOUR_NEWS_SITE_URL' with the actual URL of the news site
const newsSiteUrl = 'https://www.hirunews.lk/';

// Schedule the task to run every hour (adjust as needed)
cron.schedule('0 * * * *', async () => {
  try {
    const newsData = await scrapeNews();
    const formattedNews = formatNews(newsData);
    
    // Get all active chat IDs and send news updates
    const chatIds = await bot.getChatAdministrators(process.env.TELEGRAM_CHAT_ID);
    chatIds.forEach((chat) => {
      bot.sendMessage(chat.user.id, formattedNews);
    });
  } catch (error) {
    console.error('Error fetching or sending news:', error.message);
  }
});

// Event listener for incoming messages
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Type /news to get the latest news updates or /getnews to manually check for news.');
});

bot.onText(/\/news/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const newsData = await scrapeNews();
    bot.sendMessage(chatId, formatNews(newsData));
  } catch (error) {
    bot.sendMessage(chatId, 'Error fetching news. Please try again later.');
  }
});

// Function to scrape news from the website
async function scrapeNews() {
  const response = await axios.get(newsSiteUrl);
  const $ = cheerio.load(response.data);

  const newsData = [];

  $('.story-box').each((index, element) => {
    const title = $(element).find('.story-title').text().trim();
    const link = $(element).find('a').attr('href');
    newsData.push({ title, link });
  });

  return newsData;
}

// Function to format news data for display
function formatNews(newsData) {
  let formattedNews = 'Latest News Updates:\n\n';

  newsData.forEach((article, index) => {
    formattedNews += `${index + 1}. ${article.title}\n${article.link}\n\n`;
  });

  return formattedNews;
}
