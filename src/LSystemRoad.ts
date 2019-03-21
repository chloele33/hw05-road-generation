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
    mapTexture: Uint8Array;

    // Store your roads as sets of edges and intersections
    edges:Edge[];
    intersections: Intersection[];

    constructor (textureData: Uint8Array) {
        //Your Turtle will begin from a random point in the bounds of your screen.
        let randPos = vec4.fromValues(Math.random() - 0.5, Math.random() - 0.5, 1, 1);
        let orient = vec4.fromValues(0, 1, 0, 0);

        this.currTurtle = new Turtle(randPos, orient, 1);
    }

    // check if the nearest intersection to the endpoint is close enough
    // return the closest intersection if found, null if not found
    existsCloseIntersection(currPoint: vec3, roadSize: number, searchDist: number) : Intersection {
        let index = -1;
        let minDist = searchDist;
        for (var i = 0; i < this.intersections.length; i++) {
            let currDist = this.distance(currPoint, this.intersections[i].position);
            if ( currDist < minDist) {
                index = i;
                minDist = currDist;
            }
        }

        // if found
        if (index != -1) {
            if (roadSize > this.intersections[index].size) {
                this.intersections[index].size = roadSize;
            }
            return this.intersections[index];
        }

        return null;
    }

    // distance helper function
    distance(startPt: vec3, endPt: vec3) : number {
        let a = (startPt[0] - endPt[0]) * (startPt[0] - endPt[0]);
        let b = (startPt[1] - endPt[1]) * (startPt[1] - endPt[1]);
        let c = (startPt[2] - endPt[2]) * (startPt[2] - endPt[2]);
        return Math.sqrt(a + b + c);
    }


    // adding an edge/road to the system, origin is current turtle's position
    // end point is checked
    addRoadToNetwork(startingPoint: vec3, endPoint: vec3, size: number) : vec3 {

        let newEdge = new Edge(startingPoint, endPoint, size);
        let endNode = new Intersection(endPoint, size);
        // look for the correct endpoint
        let correct_end: vec3;

        // if two streets intersect, generate an intersection

        // if the end point is close to an existing intersection, use that inter as endpoint
        let searchDist = 5;
        let nearInter = this.existsCloseIntersection(endPoint, size, searchDist);
        if (nearInter != null) {
            correct_end = nearInter.position;
        }

        // if close to intersecting, extend street to form an intersection

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
