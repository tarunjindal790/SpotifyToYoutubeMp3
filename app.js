var SpotifyWebApi = require('spotify-web-api-node');
var express = require('express');
var {google} = require('googleapis');

var PORT = process.env.PORT || 3000;
var redirectTo = `https://spotify-to-youtube-mp3.herokuapp.com/`;
var app = express();
app.set('view engine', 'ejs');
// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: redirectTo+'callback'
  });

  const scopes = [
    // 'ugc-image-upload',
    'user-read-playback-state',
    // 'user-modify-playback-state',
    'user-read-currently-playing',
    // 'streaming',
    'app-remote-control',
    'user-read-email',
    // 'user-read-private',
    'playlist-read-collaborative',
    // 'playlist-modify-public',
    'playlist-read-private',
    // 'playlist-modify-private',
    // 'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    // 'user-follow-modify'
  ];


app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
  });

app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
    const access_token = data.body['access_token'];
    const refresh_token = data.body['refresh_token'];
    const expires_in = data.body['expires_in'];

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    console.log('access_token:', access_token);
    console.log('refresh_token:', refresh_token);

    console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
    );
    // res.send('Success! You can now close the window.');
    res.redirect('test');

    setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];

        console.log('The access token has been refreshed!');
        console.log('access_token:', access_token);
        spotifyApi.setAccessToken(access_token);
    }, expires_in / 2 * 1000);
    })
    .catch(error => {
    console.error('Error getting Tokens:', error);
    res.send(`Error getting Tokens: ${error}`);
    });
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/test', function(req, res){
    let currentTrackName= '';
    spotifyApi.getMyCurrentPlayingTrack().then(
        function(data){
            console.log('Result Body',data);
            currentTrackName = data.body.item.name;
            // res.render('index', {track:currentTrackName});
            google.youtube('v3').search.list({
              key: process.env.YOUTUBE_API_KEY,
              part: 'snippet',
              q: currentTrackName,
              maxResults: 1
            }).then(
              function (q) {
                console.log('From Youtube:',q.data.items[0].id.videoId);
                res.render('download', {track:currentTrackName, videoId: q.data.items[0].id.videoId});
              }
            )
        },
        function(err){
            console.log('error', err);
        }
    );
})

app.listen(PORT, function () {
  console.log('Example app listening on port !',PORT);
});

