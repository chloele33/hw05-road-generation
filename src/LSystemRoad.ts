import ExpansionRule from './ExpansionRule';
import {Turtle, TurtleStack} from './Turtle'
import DrawingRule from './DrawingRule';
import  TreeScene  from "./geometry/TreeScene";
import {vec2, vec3, vec4, mat4} from "gl-matrix";
import CustomMesh from './geometry/CustomMesh';
import {readTextFile} from './globals';

class LSystemRoad {
    currTurtle: Turtle;
    turtleStack: TurtleStack;

    // Store your roads as sets of edges and intersections
    edgeSet: Set<Edge> = new Set();
    intersectionSet: Set<Intersection> = new Set();

    constructor () {
        //Your Turtle will begin from a random point in the bounds of your screen.
        let randPos = vec4.fromValues(Math.random() - 0.5, Math.random() - 0.5, 1, 1);
        let orient = vec4.fromValues(0, 1, 0, 0);

        this.currTurtle = new Turtle(randPos, orient, 1);
    }

    // check if the nearest intersection to the endpoint is close enough
    // return the closest intersection


    // adding an edge/road to the system, origin is current turtle's position
    // end point is checked
    addRoadToNetwork(startingPoint: vec3, endPoint: vec3, size: number) : vec3 {

        let newEdge = new Edge(startingPoint, endPoint, size);
        let endNode = new Intersection(endPoint, size);
        // look for the correct endpoint
        let correct_end: vec3;

        if (endPoint == correct_end) {


        }

        return correct_end;
    }



}

class Intersection {
    position: vec3;
    size: number;// size of largest sized road intersecting this point

    constructor(pos: vec3, size: number) {
        this.position = pos;
        this.size = size;
    }
}

class Edge {
    startingPoint: vec3;
    endPoint: vec3;
    direction: vec3;
    size: number;

    constructor (start: vec3, end: vec3, size: number) {
        this.startingPoint = start;
        this.endPoint = end;
        this.size = size;
    }

}

export default LSystemRoad;
