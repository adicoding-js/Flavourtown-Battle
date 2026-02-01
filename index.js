const canvas = document.querySelector('#gameCanvas');
const c = canvas.getContext('2d');
// This sets resoultion of canvas (we will keep it 16:9 ratio)
canvas.width = 1024;;
canvas.height = 576;

//variables
const gravity = 0.7;
let timer = 60;
let timerId;

// This fills the background for initial/first render
c.fillRect(0, 0, canvas.width, canvas.height);

//Class(Flavours for Flavourmans) definitions
class Fighter {
    constructor({position, velocity, color = 'red', offset, name}) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.lastKey; // This fixes the stutter when switching keys.(learned from Perplexity Ai)

        //Fight/Comabt Stats
        this.color = color;
        this.name = name;
        this.health = 100;

        //Attack Box
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 100,
            height: 50
        };
        this.isAttacking = false;
    }
        // Draws the Fighter
        draw() {
            c.fillstyle = this.color;
            c.fillRect(this.position.x, this.position.y, this.width, this.height);

            //Attack Box for debugging
            if (this.isAttacking) {
                c.fillstyle = 'rgba(255, 0, 0, 0.5)';
                c.fillRect(
                    this.attackBox.position.x,
                    this.attackBox.position.y,
                    this.attackBox.width,
                    this.attackBox.height
                );
            }
        }
}


update() ;{
    this.draw();

    // Update attack box position to follow the fighter
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
    this.attackBox.position.y = this.position.y;

    //moves fighter
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    //gravity logic
    // Logic: If the fighter is above the bottom of the canvas, apply gravity
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 50) { // -50 creates a "floor" offset
            this.velocity.y = 0;
            this.position.y = 376; // Snap to ground (canvas height - 50 - player height)
        } else {
            this.velocity.y += gravity;
        }
    }

    // Attack lasts for 100 milliseconds
    attack() ;{
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100);
    }

    //Player 1: Spicy (Red)
const spicy = new Fighter({
    position: { x: 100, y: 0},
    velocity: { x: 0, y: 0},
    color: '#FF4d4d',
    offset: { x: 0, y: 0 },
    name: 'Spicy'
});


    
        





    