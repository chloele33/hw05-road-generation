// A Turtle class to represent the current drawing state of your L-System.
// It should at least keep track of its current position, current orientation,
// and recursion depth (how many [ characters have been found while drawing before ]s)
import { vec3, mat4, vec4, quat } from "gl-matrix";
import {readTextFile} from './globals';

const deg2Rad = 0.017453292519943295769236907684886;


class Turtle {
    pos: vec4;
    orient: vec4;
    depth: number;

    // up: vec3;
    // forward: vec3;
    // left: vec3;

    constructor(pos: vec4, orient: vec4, depth: number) {
        let tempPos = vec4.create();
        vec4.add(tempPos, tempPos, pos);
        this.pos = tempPos;

        let tempOrient = vec4.create();
        vec4.add(tempOrient, tempOrient, orient);
        this.orient = tempOrient;

        let tempDepth = 0;
        tempDepth = tempDepth + depth;
        this.depth = tempDepth;
    }

    moveForward(d: number) {
        let dist = vec4.create();
        vec4.multiply(dist, [d, d, d, 1], this.orient);
        vec4.add(this.pos, this.pos, dist);
    }

    public rotate(axis: vec3, deg: number) {
        let rotmat = mat4.fromValues(0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0);

        let rad = deg2Rad * deg;
        mat4.fromRotation(rotmat, rad, axis);
        vec4.transformMat4(this.orient, this.orient, rotmat);
    }

}

class TurtleStack {
    list = new Array<Turtle>();

    public push(turtle: Turtle) {
        this.list.push(turtle);
    }

    public pop(): Turtle {
        return this.list.pop();
    }
}

export {Turtle, TurtleStack};
