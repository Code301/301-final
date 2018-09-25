'use strict';

const pg = require('pg');
require('dotenv').config();

const conString = process.env.DATABASE_URL;
const authKey = process.env.KEY;

const client = new pg.Client(conString);

client.connect();
client.on('error', error => console.log(error));

const superagent = require('superagent');


const getIndex = (req, res) => {
  console.log('im at index woohoo');
  res.redirect('/patient');
};


const getPatients = (req, res) => {
  let SQL = 'SELECT * FROM patients';
  client.query(SQL, (err, serverRes) => {
    if(err){
      console.error(err);
      res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
    }else{
      res.render('index', {patients: serverRes.rows});
    }
  });
};


const getAbout = (req, res) => {
  console.log('about us, boring..');
};


const patientInfo = (req, res) => {
  let SQL = 'SELECT * FROM patients WHERE id = $1';
  let values = [req.params.patientId];
  client.query(SQL, values, (err, patientRes) => {
    if(err){
      console.error(err);
      res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
    } else {
      SQL = "SELECT id, TO_CHAR(date, 'mon dd, yyyy') AS date, title FROM records WHERE patient_id = $1 ORDER BY id DESC";
      client.query(SQL, values, (err, recordsRes) => {
        if(err){
          console.error(err);
          res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
        } else {
          res.render('pages/patient', {patient: patientRes.rows[0], records: recordsRes.rows, added: !!req.query.added});
        }
      });
    }
  });
};


const recordInfo = (req, res) => {
  let SQL = "SELECT id, TO_CHAR(date, 'mon dd, yyyy') AS date, title, description FROM records WHERE id = $1";
  let values = [req.params.recordId];
  client.query(SQL, values, (err, serverRes) => {
    if(err){
      console.error(err);
      res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
    }else{
      res.render('pages/recordDetail', {record: serverRes.rows[0], added: !!req.query.added, patient_id: req.params.patientId});
    }
  });
};


const analyzeRecord = (req, res) => {
  let SQL = 'SELECT id, title, description FROM records WHERE patient_id = $1;';
  let values = [req.params.patientId];
  client.query(SQL, values, (err, apiResponse) => {
    if(err) {
      console.log(err);
      res.render('pages/error', {message: 'poop'});
    } else {
      let analysisData = apiResponse.rows.map(data => {
        return {language: 'en', id: data.id, text: `${data.title} ${data.description}` };
      });

      let reqData = {documents: analysisData };

      superagent.post('https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases')
        .set('Ocp-Apim-Subscription-Key', authKey)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json')
        .send(reqData)
        .then(res => {
          let phraseList = JSON.parse(res.text).documents;
          console.log(phraseList);
          let filterList = ['day', 'week', 'days', 'weeks', 'month', 'months', 'year', 'years'];
          // console.log(JSON.parse(res.text).documents[0].keyPhrases);

        });

      res.send('werk');
    }
  });
};


const newPatient = (req, res) => {
  let SQL = 'INSERT INTO patients (first_name, last_name) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING id';
  let values = [req.body.first_name, req.body.last_name];
  client.query(SQL, values, (err, serverRes) => {
    if(err){
      console.error(err);
      res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
    }else{
      res.redirect(`/patient/${serverRes.rows[0].id}?added=true`);
    }
  });
};


const newRecord = (req, res) => {
  console.log('new record, plz no big bills');
  let SQL = 'INSERT INTO records (patient_id, title, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id';
  let values = [req.body.patient_id, req.body.title, req.body.description];
  client.query(SQL, values, (err, serverRes) => {
    if(err){
      console.error(err);
      res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
    }else{
      res.redirect(`/record/${req.body.patient_id}/${serverRes.rows[0].id}?added=true`);
    }
  });
};


const deletePatient = (req, res) => {
  let SQL = 'DELETE FROM patients WHERE id = $1';
  let values = [req.params.patientId];
  client.query(SQL, values, (err, serverRes) => {
    if(err){
      console.error(err);
      res.render('pages/error', {message: 'Server Error: We could not handle your request. Sorry!'});
    }else{
      res.redirect('/patient');
    }
  });
};


module.exports = {
  getIndex: getIndex,
  getPatients: getPatients,
  getAbout: getAbout,
  patientInfo: patientInfo,
  recordInfo: recordInfo,
  analyzeRecord: analyzeRecord,
  newPatient: newPatient,
  newRecord: newRecord,
  deletePatient: deletePatient
};