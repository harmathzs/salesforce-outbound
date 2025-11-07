const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');

const app = express();
const PORT = 3333;

// Salesforce outbound messages are sent as raw XML, so parse raw body
app.use(bodyParser.text({ type: 'text/xml' }));

app.post('/order', (req, res) => {
  const xml = req.body;

  xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
    if (err) {
      console.error('XML parse error:', err);
      return res.status(400).send('Invalid XML');
    }

    try {
      // Navigate to the outbound message data structure
      // Salesforce outbound message typically looks like this:
      // <soapenv:Envelope>
      //   <soapenv:Body>
      //     <notifications>
      //       <Notification>
      //         <sObject>
      //           <fieldName>value</fieldName>
      //           ...
      //         </sObject>
      //       </Notification>
      //     </notifications>
      //   </soapenv:Body>
      // </soapenv:Envelope>

      const notification = result['soapenv:Envelope']['soapenv:Body']['notifications']['Notification'];
      const sObject = notification.sObject;

      console.log('Received Order data:', sObject);

      // Here you can access individual fields like sObject.OrderNumber, sObject.Status, etc.

      // Respond with a successful SOAP acknowledgement
      const soapResponse = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
          <soapenv:Body>
            <notificationsResponse xmlns="http://soap.sforce.com/2005/09/outbound">
              <Ack>true</Ack>
            </notificationsResponse>
          </soapenv:Body>
        </soapenv:Envelope>`;

      res.type('application/xml');
      res.send(soapResponse);
    } catch (e) {
      console.error('Error processing notification:', e);
      res.status(500).send('Server error');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
