import ExpansionRule from './ExpansionRule';
import {Turtle, TurtleStack} from './Turtle'
import DrawingRule from './DrawingRule';
import  TreeScene  from "./geometry/TreeScene";
import {vec2, vec3, vec4, mat4, quat} from "gl-matrix";
import CustomMesh from './geometry/CustomMesh';
import {readTextFile} from './globals';

class LSystemRoad {
    currTurtle: Turtle;
    turtleStack: TurtleStack;
    mapTexture: MapTexture;
    turtleStackHighway: TurtleStack;

    // Store your roads as sets of edges and intersections
    edges:Edge[];
    intersections: Intersection[];

    constructor (textureData: Uint8Array, texWidth: number, texHeight: number) {
        //Your Turtle will begin from a random point in the bounds of your screen.
        let randPos = vec4.fromValues(Math.random() - 0.5, Math.random() - 0.5, 1, 1);
        let orient = vec4.fromValues(0, 1, 0, 0);
        this.mapTexture = new MapTexture(textureData, texWidth, texHeight);
        this.currTurtle = new Turtle(randPos, orient, 1);
    }

    // generate highway system
    growHighway() {

    }

    // generate roads
    growRoads() {

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

    getVBO() {
        let col1Array: number[] = [];
        let col2Array: number[] = [];
        let col3Array: number[] = [];
        let col4Array: number[] = [];
        let colorsArray: number[] = [];

        for (var i = 0; i < this.edges.length; i++) {
            let currEdge = this.edges[i];
            let currTransform = currEdge.getTranform();

            col1Array.push(currTransform[0]);
            col1Array.push(currTransform[1]);
            col1Array.push(currTransform[2]);
            col1Array.push(currTransform[3]);

            col2Array.push(currTransform[4]);
            col2Array.push(currTransform[5]);
            col2Array.push(currTransform[6]);
            col2Array.push(currTransform[7]);

            col3Array.push(currTransform[8]);
            col3Array.push(currTransform[9]);
            col3Array.push(currTransform[10]);
            col3Array.push(currTransform[11]);

            col4Array.push(currTransform[12]);
            col4Array.push(currTransform[13]);
            col4Array.push(currTransform[14]);
            col4Array.push(currTransform[15]);

            colorsArray.push(0);
            colorsArray.push(0);
            colorsArray.push(0);
            colorsArray.push(1);
        }

        let col1: Float32Array = new Float32Array(col1Array);
        let col2: Float32Array = new Float32Array(col2Array);
        let col3: Float32Array = new Float32Array(col3Array);
        let col4: Float32Array = new Float32Array(col4Array);
        let colors: Float32Array = new Float32Array(colorsArray);

        let ret: any = {};
        ret.col1 = col1;
        ret.col2 = col2;
        ret.col3 = col3;
        ret.col4 = col4;
        ret.colors = colors;

        return ret;
    }
}

class MapTexture {
    texData: Uint8Array;
    width: number;
    height: number;
    constructor(textureData: Uint8Array, width: number, height: number) {
        this.texData = textureData;
        this.width = width;
        this.height = height;
    }

    getPopulation(x: number, y: number) : number {
        let xPos = Math.floor((x + 1.0) / 2 * this.width);
        let yPos = Math.floor((y + 1.0) / 2 * this.height);
        let offset = 3.0;
        let index = yPos * this.width * 4 + xPos * 4 + offset;
        let result = this.texData[index];
        return result / 255.0;
    }

    // 1 if is land, 0 if is water
    getElevation(x: number, y: number) : number {
        let xPos = Math.floor((x + 1.0) / 2 * this.width);
        let yPos = Math.floor((y + 1.0) / 2 * this.height);
        let offsetWater = 2.0;
        let offsetLand = 1.0;
        let water = this.texData[yPos * this.width * 4 + xPos * 4 + offsetWater]
        let land = this.texData[yPos * this.width * 4 + xPos * 4 + offsetLand]
        if (water > land) {
            return 0;
        }
        return 1;
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

    getTranform() {
        let up = vec3.fromValues(0, 0, 1);
        let dir: vec3 = vec3.fromValues(0, 0, 0);
        vec3.subtract(dir, this.endPoint, this.startingPoint);

        // get angle
        let x1 = this.startingPoint[0];
        let y1 = this.startingPoint[2];

        let x2 = this.endPoint[0];
        let y2 = this.endPoint[2];

        let angleRad = -Math.atan2(x1 * y2 - y1 * x2, x1 * x2 + y1 * y2);
        let globalRotate = vec3.fromValues(0, 1, 0);
        let rotationQuat = quat.create();
        quat.setAxisAngle(rotationQuat, globalRotate, angleRad);

        // mid point
        let x = this.startingPoint[0] + this.endPoint[0];
        let y = this.startingPoint[1] + this.endPoint[1];
        let z = this.startingPoint[2] + this.endPoint[2];
        let translate = vec3.fromValues(x / 2, y / 2, z / 2);
        let scaleVec = vec3.fromValues(this.size, 1, vec3.length(dir));
        let transformationMat: mat4 = mat4.create();
        mat4.fromRotationTranslationScale(transformationMat, rotationQuat, translate, scaleVec);
        return transformationMat;
    }

}

export {LSystemRoad};
