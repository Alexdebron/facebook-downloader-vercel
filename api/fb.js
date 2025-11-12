const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const url = (req.query.url || req.query.u || '').trim();
    if (!url) return res.status(400).json({ error: true, message: 'Please provide ?url=' });

    if (!/facebook\.[A-Za-z0-9]+\/(reel|watch|share|video)/gi.test(url)) {
      return res.status(400).json({ error: true, message: 'Invalid Facebook URL' });
    }

    const r = await axios.get('https://fdownloader.net/id', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const html = r.data;
    const exMatch = html.match(/k_exp\s*=\s*"(\d+)"/i);
    const toMatch = html.match(/k_token\s*=\s*"([a-f0-9]+)"/i);
    const ex = exMatch ? exMatch[1] : null;
    const to = toMatch ? toMatch[1] : null;

    if (!ex || !to) {
      return res.status(502).json({ error: true, message: 'Failed to extract tokens from fdownloader' });
    }

    const params = new URLSearchParams();
    params.append('k_exp', ex);
    params.append('k_token', to);
    params.append('q', url);
    params.append('lang', 'id');
    params.append('web', 'fdownloader.net');
    params.append('v', 'v2');
    params.append('w', '');

    const s = await axios.post('https://v3.fdownloader.net/api/ajaxSearch?lang=id', params.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://fdownloader.net'
      },
      timeout: 20000
    });

    const data = s.data;
    if (!data || data.status !== 'ok') {
      return res.status(502).json({ error: true, message: 'Failed to fetch video data from fdownloader' });
    }

    const $ = cheerio.load(data.data);
    const title = $('.thumbnail > .content > .clearfix > h3').text().trim() || null;
    const duration = $('.thumbnail > .content > .clearfix > p').text().trim() || null;
    const thumbnail = $('.thumbnail > .image-fb > img').attr('src') || null;
    const media = $('#popup_play > .popup-body > .popup-content > #vid').attr('src') || null;
    const music = $('#fbdownloader').find('#audioUrl').attr('value') || null;

    const videoList = [];
    $('#fbdownloader')
      .find('.tab__content')
      .eq(0)
      .find('tr')
      .each((_, el) => {
        const quality = $(el).find('.video-quality').text().trim() || null;
        const urlv = $(el).find('a').attr('href') || $(el).find('button').attr('data-videourl') || null;
        if (urlv && urlv !== '#note_convert') videoList.push({ quality, url: urlv });
      });

    return res.json({
      status: true,
      creator: 'Chamod Nimsara',
      metadata: { title, duration, thumbnail },
      download: { media, music, videos: videoList }
    });
  } catch (err) {
    console.error('ERR', err && err.message);
    return res.status(500).json({ error: true, message: 'Internal server error', detail: err && err.message });
  }
};
