
import ExpansionRule from './ExpansionRule';
import {Turtle, TurtleStack} from './Turtle'
import DrawingRule from './DrawingRule';
import  TreeScene  from "./geometry/TreeScene";
import {vec3, vec4, mat4} from "gl-matrix";
import CustomMesh from './geometry/CustomMesh';
import {readTextFile} from './globals';



const deg2Rad = 0.017453292519943295769236907684886;


export default class LSystem {
    axiom: string;
    iterations: number;
    expansionRules: ExpansionRule;
    expandedString: string;
    angle: number;
    step: number;


    turtleStack : TurtleStack;
    drawingRules: DrawingRule;
    turtle: Turtle;

    OBJ: any;
    branch: any;
    leaf: any;
    treeScene: TreeScene;
    leafScene: TreeScene;

    transformation: mat4;



    constructor(axiom: string, iterations: number, angle: number, step: number) {
        this.axiom = axiom;
        this.iterations = iterations;
        this.angle = angle;
        this.step = step;

        // load custom files
        this.OBJ = require('webgl-obj-loader');

       // var meshData = readTextFile("/src/obj/cylinder.obj");
        var meshData = readTextFile("https://raw.githubusercontent.com/chloele33/lsystem-tree/master/src/obj/cylinder.obj");
        this.branch = new this.OBJ.Mesh(meshData);

        meshData = readTextFile("https://raw.githubusercontent.com/chloele33/lsystem-tree/master/src/obj/leaf2.obj");
        this.leaf = new this.OBJ.Mesh(meshData);

        // set up expansion rules
        this.expansionRules = new ExpansionRule();
        this.setupExpansionRules();

        // set up drawing rules
        this.drawingRules = new DrawingRule();
        this.setupDrawingRules();


        this.process();


    }

    setDefaultAngle(angle: number){
        this.angle = angle;
        this.turtleStack = new TurtleStack();
        this.turtle = new Turtle(vec4.fromValues(0, -60, -220, 1), vec4.fromValues(0, 1, 0, 0), 0);
    }
    setDefaultStep(step: number){
        this.step = step;
        this.turtleStack = new TurtleStack();
        this.turtle = new Turtle(vec4.fromValues(0, -60, -220, 1), vec4.fromValues(0, 1, 0, 0), 0);
    }

    setDefaultIteration(iteration: number){
        this.iterations = iteration;
        this.turtleStack = new TurtleStack();
        this.expandString();
        this.turtle = new Turtle(vec4.fromValues(0, -60, -220, 1), vec4.fromValues(0, 1, 0, 0), 0);
    }




    process() {
        this.expandString();

        // set up turtle
        this.turtleStack = new TurtleStack();
        this.turtle = new Turtle(vec4.fromValues(0, -60, -220, 1), vec4.fromValues(0, 1, 0, 0), 0);

        return;
    }

    // returns expanded string using axiom, number of iterations, and expansionRules
    expandString() {
        var result = this.axiom;
        for (var i = 0; i < this.iterations; i++) {

            var exp = "";
            for (let j = 0; j < result.length; j++) {
                let c = result.charAt(j);
                if (!this.expansionRules.expMap.has(c)) {
                    exp += c;
                    continue;
                }
                exp += this.expansionRules.expand(c);
            }
            result = exp;
        }
        this.expandedString = result;

        return;
    }

    setupExpansionRules() {
        let rules: Array<[string, string, number]> = [
            ['B', 'BB', 1.0],
            ['F', 'FF[YFXFXF][ZFYFYF][XFZFZF]', 0.5],
            ['F', 'FF[YFXFXF][XFZFZF][ZFYFYF]', 0.5]];

        // let rules: Array<[string, string, number]> = [
        //     ['B', 'BB', 1.0],
        //     ['F', 'FF[YFYFXF]', 0.3],
        //     ['F', 'FF[ZFZFYF]', 0.3],
        //     ['F', 'FF[XFXFZF]', 0.3],
        //     ['F', 'F', 0.1]];

        for (var i = 0; i < rules.length; i++) {
            var currRule = rules[i];
            this.expansionRules.set(currRule[0], currRule[1], currRule[2]);
        }
    }

    rotZ() {
        this.turtle.rotate(vec3.fromValues(0, 0, 1), this.angle);
    }

    rotZNeg(this: any) {
        this.turtle.rotate(vec3.fromValues(0, 0, 1), -this.angle);
    }

    rotX(this: any) {
        this.turtle.rotate(vec3.fromValues(1, 0, 0), this.angle);
    }

    rotXNeg(this: any) {
        this.turtle.rotate(vec3.fromValues(1, 0, 0), -this.angle);
    }

    rotY(this: any) {
        this.turtle.rotate(vec3.fromValues(0, 1, 0), this.angle);
    }

    rotYNeg(this: any) {
        this.turtle.rotate(vec3.fromValues(0, 1, 0), -this.angle);
    }


    drawTrunk() {
        let cylinder = new CustomMesh(this.branch);
        cylinder.scale(2, 5, 2);
        cylinder.translate(vec4.fromValues(-0.5, 0, -0.5, 1.0));
        this.drawBranch(cylinder);

        // move turtle forward
        let branchLen = cylinder.height;
        branchLen = this.step;
        this.turtle.moveForward(branchLen);
    }

    drawBranch(cyl: CustomMesh) {
        // rotate model
        let orient = vec3.fromValues(this.turtle.orient[0], this.turtle.orient[1], this.turtle.orient[2]);
        let modelOri = vec3.fromValues(0, 1, 0);
        if (!vec3.equals(orient, modelOri)) {
            let normOri = vec3.fromValues(0, 0, 0);
            vec3.cross(normOri, modelOri, orient);
            let rad = Math.acos(vec3.dot(orient, modelOri));
            cyl.rotate(rad / deg2Rad, normOri);
        }

        cyl.translate(this.turtle.pos);
        this.treeScene.addMesh(cyl);
    }

    drawForward() {
        let cylinder = new CustomMesh(this.branch);
        cylinder.scale(1 / Math.pow(2, this.turtle.depth),
            1 / Math.pow(2, this.turtle.depth) * 5 + this.step,
            1 / Math.pow(2, this.turtle.depth) );
        cylinder.translate(vec4.fromValues(0.0, 10, 0.0, 1.0));
        this.drawBranch(cylinder);

        // move turtle forward
        let branchLen = cylinder.height;
       // branchLen += this.step;
        this.turtle.moveForward(branchLen);

    }

    drawBranchLeaf() {
        let upDir = vec3.fromValues(0, 1, 0);
        let orient = vec3.fromValues(this.turtle.orient[0], this.turtle.orient[1], this.turtle.orient[2]);
        let theta = Math.acos(vec3.dot(orient, upDir));
        if (Math.abs(theta - 3.14/2) < 3.14/15*(0.8) + 3) {
            let leaf = new CustomMesh(this.leaf);
             leaf.scale(5, 5, 5);
            // randomly rotate
            let rand = Math.random();
            leaf.rotate(360 * rand, vec3.fromValues(1, 0, 0));
            leaf.rotate(360 * rand, vec3.fromValues(0, 1, 0));
            leaf.rotate(360 * rand, vec3.fromValues(0, 0, 1));
            // move leaf to turtle's position
            leaf.translate(this.turtle.pos);
            this.leafScene.addMesh(leaf);
        }
        this.drawForward();
    }

    setupDrawingRules() {
        let rules: Array<[string, any, number]> = [
            ['B', 1, 1],
            ['F', 2, 0.55],
            ['F', 3, 0.45,],
            ['X', 4, 0.50],
            ['X', 5, 0.50],
            ['Z', 6, 0.50],
            ['Z', 7, 0.50],
            ['Y', 8, 0.50],
            ['Y', 9, 0.50]
        ];

        for(var i = 0; i< rules.length; i++) {
            this.drawingRules.set(rules[i][0], rules[i][1], rules[i][2]);
        }

    }

    drawTree(treeScene: TreeScene, leafScene: TreeScene) : void {
        this.treeScene = treeScene;
        this.leafScene = leafScene;
        var str = this.expandedString;
        var depth = 0;
        for (var i = 0; i < str.length; i++) {
            var c = str.charAt(i);
            if (c === '[') {
                this.turtleStack.push(new Turtle(this.turtle.pos, this.turtle.orient, depth));
                this.turtle.depth++;
            } else if (c === ']') {
                this.turtle = this.turtleStack.pop();
            }
            let drawFunc = this.drawingRules.get(c);
            var context = this;
            if (drawFunc === 1) {
                this.drawTrunk();
            } else if (drawFunc === 2) {
                this.drawForward();
            } else if (drawFunc === 3) {
                this.drawBranchLeaf();
            } else if (drawFunc === 4) {
                this.rotX();
            } else if (drawFunc === 5) {
                this.rotXNeg();
            } else if (drawFunc === 6) {
                this.rotZ();
            } else if (drawFunc === 7) {
                this.rotZNeg();
            } else if (drawFunc === 8) {
                this.rotY();
            } else if (drawFunc === 9) {
                this.rotYNeg();
            }
        }

    }

}

export {LSystem};