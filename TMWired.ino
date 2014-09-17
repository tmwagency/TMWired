#define KLAXPIN         3
#define VIBPIN          7
#define FLASHLEDPIN     5
#define CONTACTPIN      11
#define STARTPIN        4
#define COMPLETEPIN     9


boolean contact = false;
boolean complete = false;
boolean startPosition = false;

int sens = 4; // reads
long timeout = 100;

long lastContactMillis = 0;
int contactCount = 0;
long lastCompleteMillis = 0;
int completeCount = 0;


long lastMillis = 0;
bool gameOver = true;
long flashLedDelay = 1000;
int ledState = 0;




void setup() {                

  pinMode(KLAXPIN, OUTPUT);
  pinMode(FLASHLEDPIN, OUTPUT);
  pinMode(VIBPIN, OUTPUT);

  pinMode(STARTPIN, INPUT);
  pinMode(COMPLETEPIN, INPUT);
  pinMode(CONTACTPIN, INPUT);

  digitalWrite(CONTACTPIN, HIGH);
  digitalWrite(STARTPIN, HIGH);
  digitalWrite(COMPLETEPIN, HIGH);
  Serial.begin(9600);

}


void loop() {

  if (!gameOver) {

    boolean contactRead = digitalRead(CONTACTPIN);
    if (!contactRead) {
      contactCount++;
      lastContactMillis = millis();
      if (contactCount > sens) {
        contact = true;
      }
      else if (millis() - lastContactMillis > timeout) {
        contactCount = 0;
      }
    }

    boolean completeRead = digitalRead(COMPLETEPIN);
    if (!completeRead) {
      completeCount++;
      lastCompleteMillis = millis();
      if (completeCount > sens) {
        complete = true;
      }
      else if (millis() - lastCompleteMillis > timeout) {
        completeCount = 0;
      }
    }

    if (contact) {
      contactHappened();
    }
    if (complete) {
      gameComplete();
    }
    flashLed();
  }


  if (Serial.available() > 0) {
    int inByte = Serial.read();

    switch (inByte) {

    case '0':    
      resetGame();
      break;

    case '1':    
      resetGame();
      break;
    }
  }
  delay(2);
}




void contactHappened() {
  Serial.println("FAIL");
  digitalWrite(KLAXPIN, HIGH);
  digitalWrite(VIBPIN, HIGH);
  delay(1000);               // wait for a second
  digitalWrite(KLAXPIN, LOW);
  digitalWrite(VIBPIN, LOW);

  gameOver = true;
}

void flashLed() {
  if (!gameOver) {
    if ((millis() - flashLedDelay) > lastMillis) {
      ledState = !ledState;
      lastMillis = millis();
    }
    digitalWrite(FLASHLEDPIN, ledState);   
  }
  else {
    digitalWrite(FLASHLEDPIN, HIGH); 
  }
}

void gameComplete() {

  Serial.println("COMPLETE");
  gameOver = true;
}

void resetGame() {

  startPosition = digitalRead(STARTPIN);

  if (!startPosition) {
    contact = true;
    complete = true;
    gameOver = false;
    Serial.println("READY");
  }
  else {
    Serial.println("NOTREADY");
  }


}














