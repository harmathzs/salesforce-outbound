/* order.js Vercel serverless function */
import { parseString } from 'xml2js';

function getRawBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // log request
  const body = req.body
  console.log('request body', body)

  const xml = await getRawBody(req);
  console.log('request body xml: ', xml);

  req.on('end', () => {
    parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) {
        console.error('XML parse error:', err);
        return res.status(400).send('Invalid XML');
      }

      try {
        const notification = result['soapenv:Envelope']['soapenv:Body']['notifications']['Notification'];
        const sObject = notification.sObject;
        console.log('Received Order data:', sObject);

        // SOAP acknowledgment response
        const soapResponse = `
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
            <soapenv:Body>
              <notificationsResponse xmlns="http://soap.sforce.com/2005/09/outbound">
                <Ack>true</Ack>
              </notificationsResponse>
            </soapenv:Body>
          </soapenv:Envelope>`;
        
        res.status(200).setHeader('Content-Type', 'application/xml');
        res.send(soapResponse);
      } catch (e) {
        console.error('Error processing notification:', e);
        res.status(500).send('Server error');
      }
    });
  });
}
