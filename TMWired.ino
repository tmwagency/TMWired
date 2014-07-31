#define KLAXPIN         3
#define VIBPIN          7
#define FLASHLEDPIN     5
#define CONTACTPIN      11


bool contact = false;
long lastMillis = 0;
bool gameOver = false;
long flashLedDelay = 1000;
int ledState = 0;


// the setup routine runs once when you press reset:
void setup() {                
  // initialize the digital pin as an output.
  pinMode(KLAXPIN, OUTPUT);
  pinMode(FLASHLEDPIN, OUTPUT);
  pinMode(CONTACTPIN, INPUT);
  pinMode(VIBPIN, OUTPUT);
  digitalWrite(CONTACTPIN, HIGH);

  Serial.begin(9600);

  resetGame();
}

// the loop routine runs over and over again forever:
void loop() {
  //check contact state
  contact = digitalRead(CONTACTPIN);
  //Serial.println(contact);
  if (!contact && !gameOver) {
    contactHappened();
  }
  flashLed();

  if (Serial.available() > 0) {
    int inByte = Serial.read();
    // string logic here
    switch (inByte) {

    case '0':    
      resetGame();
      break;

    case '1':    
      resetGame();
      break;
    }
  }
  delay(1);
}




void contactHappened() {
  Serial.println("----> Contact!");
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

void resetGame() {
  contact = false;
  gameOver = false;
  Serial.println("----> Game Reset");
}






