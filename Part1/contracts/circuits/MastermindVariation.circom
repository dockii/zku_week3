pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

// Number mastermind variation.
// Uses numbers instead of colors. Valid numbers are within [1,6] range.
// The codemaker gives an extra clue -- the sum of the digits.
template MastermindVariation() {
    // Public inputs
    signal input pubGuessA;
    signal input pubGuessB;
    signal input pubGuessC;
    signal input pubGuessD;
    signal input pubNumHit;
    signal input pubNumBlow;
    signal input pubSolnSum;
    signal input pubSolnHash;

    // Private inputs
    signal input privSolnA;
    signal input privSolnB;
    signal input privSolnC;
    signal input privSolnD;
    signal input privSalt;

    // Output
    signal output solnHashOut;

    var guess[4] = [pubGuessA, pubGuessB, pubGuessC, pubGuessD];
    var soln[4] =  [privSolnA, privSolnB, privSolnC, privSolnD];
    var j = 0;
    var k = 0;
    component greaterEqThan[8];
    component lessEqThan[8];
    component equalGuess[6];
    component equalSoln[6];
    var equalIdx = 0;

    // Create a constraint that the solution and guess digits are all less in [1,6] range.
    for (j=0; j<4; j++) {
        greaterEqThan[j] = GreaterEqThan(4);
        greaterEqThan[j].in[0] <== guess[j];
        greaterEqThan[j].in[1] <== 1;
        greaterEqThan[j].out === 1;
        greaterEqThan[j+4] = GreaterEqThan(4);
        greaterEqThan[j+4].in[0] <== soln[j];
        greaterEqThan[j+4].in[1] <== 1;
        greaterEqThan[j+4].out === 1;

        lessEqThan[j] = LessEqThan(4);
        lessEqThan[j].in[0] <== guess[j];
        lessEqThan[j].in[1] <== 6;
        lessEqThan[j].out === 1;
        lessEqThan[j+4] = LessEqThan(4);
        lessEqThan[j+4].in[0] <== soln[j];
        lessEqThan[j+4].in[1] <== 6;
        lessEqThan[j+4].out === 1;

        // Create a constraint that the solution and guess digits are unique. no duplication.
        for (k=j+1; k<4; k++) {
            equalGuess[equalIdx] = IsEqual();
            equalGuess[equalIdx].in[0] <== guess[j];
            equalGuess[equalIdx].in[1] <== guess[k];
            equalGuess[equalIdx].out === 0;
            equalSoln[equalIdx] = IsEqual();
            equalSoln[equalIdx].in[0] <== soln[j];
            equalSoln[equalIdx].in[1] <== soln[k];
            equalSoln[equalIdx].out === 0;
            equalIdx += 1;
        }
    }

    // Create a constraint that the solution and the guess digits  sum are equal to public sum.
    signal guessSum;
    guessSum <== guess[0] + guess[1] + guess[2] + guess[3];
    guessSum === pubSolnSum;
    signal solnSum;
    solnSum <== soln[0] + soln[1] + soln[2] + soln[3];
    solnSum === pubSolnSum;

    // Count hit & blow
    var hit = 0;
    var blow = 0;
    component equalHB[16];

    for (j=0; j<4; j++) {
        for (k=0; k<4; k++) {
            equalHB[4*j+k] = IsEqual();
            equalHB[4*j+k].in[0] <== soln[j];
            equalHB[4*j+k].in[1] <== guess[k];
            blow += equalHB[4*j+k].out;
            if (j == k) {
                hit += equalHB[4*j+k].out;
                blow -= equalHB[4*j+k].out;
            }
        }
    }

    // Create a constraint around the number of hit
    component equalHit = IsEqual();
    equalHit.in[0] <== pubNumHit;
    equalHit.in[1] <== hit;
    equalHit.out === 1;
    
    // Create a constraint around the number of blow
    component equalBlow = IsEqual();
    equalBlow.in[0] <== pubNumBlow;
    equalBlow.in[1] <== blow;
    equalBlow.out === 1;

    // Verify that the hash of the private solution matches pubSolnHash
    component poseidon = Poseidon(5);
    poseidon.inputs[0] <== privSalt;
    poseidon.inputs[1] <== privSolnA;
    poseidon.inputs[2] <== privSolnB;
    poseidon.inputs[3] <== privSolnC;
    poseidon.inputs[4] <== privSolnD;

    solnHashOut <== poseidon.out;
    pubSolnHash === solnHashOut;
}

component main {public [pubGuessA, pubGuessB, pubGuessC, pubGuessD, pubNumHit, pubNumBlow, pubSolnSum, pubSolnHash]} = MastermindVariation();