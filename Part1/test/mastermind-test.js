//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { expect } = require("chai")
const chai = require("chai")
const path = require("path")

const wasm_tester = require("circom_tester").wasm;

const { buildPoseidon } = require("circomlibjs");

const assert = chai.assert;

describe("MastermindVariation test", function () {
    this.timeout(100000);

    let poseidon;
    let F;
    let circuit;

    before(async () => {
        poseidon = await buildPoseidon()
        F = poseidon.F;

        circuit = await wasm_tester("contracts/circuits/MastermindVariation.circom")
        await circuit.loadConstraints()
    });

    it("Should prove the correct solution", async () => {
        const salt = 42;
        const solutionA = 1;
        const solutionB = 2;
        const solutionC = 3;
        const solutionD = 4;
        const solutionHash = F.toObject(poseidon([salt, solutionA, solutionB, solutionC, solutionD]));
        const solutionSum = solutionA + solutionB + solutionC + solutionD;

        const guessA = solutionA; // for this test
        const guessB = solutionB; // the guess
        const guessC = solutionC; // is equal
        const guessD = solutionD; // to the solution

        const input = {
            "pubGuessA": guessA,
            "pubGuessB": guessB,
            "pubGuessC": guessC,
            "pubGuessD": guessD,
            "pubNumHit": 4,              // all hits
            "pubNumBlow": 0,             // no blows
            "pubSolnSum": solutionSum,
            "pubSolnHash": solutionHash,
            "privSolnA": solutionA,
            "privSolnB": solutionB,
            "privSolnC": solutionC,
            "privSolnD": solutionD,
            "privSalt": salt
        }

        const witness = await circuit.calculateWitness(input, true)

        await circuit.assertOut(witness, { solnHashOut: solutionHash })
        await circuit.checkConstraints(witness)
    })

    it("Should calculate hits and blows for a valid guess", async () => {
        const salt = 42;
        const solutionA = 4;
        const solutionB = 5;
        const solutionC = 6;
        const solutionD = 3;
        const solutionHash = F.toObject(poseidon([salt, solutionA, solutionB, solutionC, solutionD]));
        const solutionSum = solutionA + solutionB + solutionC + solutionD;

        const guessA = 3;
        const guessB = 5;
        const guessC = 4;
        const guessD = 6;

        const input = {
            "pubGuessA": guessA,
            "pubGuessB": guessB,
            "pubGuessC": guessC,
            "pubGuessD": guessD,
            "pubNumHit": 1,
            "pubNumBlow": 3,
            "pubSolnSum": solutionSum,
            "pubSolnHash": solutionHash,
            "privSolnA": solutionA,
            "privSolnB": solutionB,
            "privSolnC": solutionC,
            "privSolnD": solutionD,
            "privSalt": salt
        }

        const witness = await circuit.calculateWitness(input, true)

        await circuit.assertOut(witness, { solnHashOut: solutionHash })
        await circuit.checkConstraints(witness)
    })

    it("Should reject invalid guess (wrong guess sum)", async () => {
        const salt = 42;
        const solutionA = 1;
        const solutionB = 2;
        const solutionC = 3;
        const solutionD = 4;
        const solutionHash = F.toObject(poseidon([salt, solutionA, solutionB, solutionC, solutionD]));
        const solutionSum = solutionA + solutionB + solutionC + solutionD;

        const guessA = 2;
        const guessB = 3;
        const guessC = 4;
        const guessD = 5; // guess sum doesn't match solution sum

        const input = {
            "pubGuessA": guessA,
            "pubGuessB": guessB,
            "pubGuessC": guessC,
            "pubGuessD": guessD,
            "pubNumHit": 0,
            "pubNumBlow": 3,
            "pubSolnSum": solutionSum,
            "pubSolnHash": solutionHash,
            "privSolnA": solutionA,
            "privSolnB": solutionB,
            "privSolnC": solutionC,
            "privSolnD": solutionD,
            "privSalt": salt
        }

        try {
            await circuit.calculateWitness(input, true)
            assert(false, "Input must be rejected by the circuit!");
        } catch (err) {
            assert(err.message.includes("Assert Failed"));
        }
    });

    it("Should reject invalid solution (guess element out of range)", async () => {
        const salt = 42;
        const solutionA = 6;
        const solutionB = 2;
        const solutionC = 3;
        const solutionD = 5;
        const solutionHash = F.toObject(poseidon([salt, solutionA, solutionB, solutionC, solutionD]));
        const solutionSum = solutionA + solutionB + solutionC + solutionD;

        const guessA = 7; // out of valid range [1,6]
        const guessB = 1;
        const guessC = 3;
        const guessD = 5;

        const input = {
            "pubGuessA": guessA,
            "pubGuessB": guessB,
            "pubGuessC": guessC,
            "pubGuessD": guessD,
            "pubNumHit": 2,
            "pubNumBlow": 0,
            "pubSolnSum": solutionSum,
            "pubSolnHash": solutionHash,
            "privSolnA": solutionA,
            "privSolnB": solutionB,
            "privSolnC": solutionC,
            "privSolnD": solutionD,
            "privSalt": salt
        }

        try {
            await circuit.calculateWitness(input, true);
            assert(false, "Input must be rejected by the circuit!");
        } catch (err) {
            assert(err.message.includes("Assert Failed"));
        }
    });
})