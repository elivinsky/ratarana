import { Col, Container, Row } from 'react-bootstrap';

import Camera from './Camera';

const App = () => (
  <Container className="text-center">
    <Row>
      <Col>Header</Col>
    </Row>
    <Row>
      <Col>
        <Camera />
      </Col>
    </Row>
    <Row>
      <Col>Footer</Col>
    </Row>
  </Container>
);

export default App;
