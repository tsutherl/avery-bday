'use strict';

const express = require('express');
const app = express();

app.use(express.static(__dirname));

app.get('*', function(req, res) {
    res.status(200).render('index.html');
});

app.listen(1337, function () {
  console.log('Server listening on port', 1337);
});