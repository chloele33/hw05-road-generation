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
    edges: Edge[];
    intersections: Intersection[];

    constructor (textureData: Uint8Array, texWidth: number, texHeight: number) {
        //Your Turtle will begin from a random point in the bounds of your screen.
        let randPos = vec4.fromValues(Math.random() - 0.5, Math.random() - 0.5, 1, 1);
        let orient = vec4.fromValues(0, 1, 0, 0);
        this.mapTexture = new MapTexture(textureData, texWidth, texHeight);
        this.currTurtle = new Turtle(randPos, orient, 1);
        this.edges = [];
        this.intersections = [];
        this.edges.push(new Edge(vec3.fromValues(0, 0, 60), vec3.fromValues(2000,0, 2000), 5));
        this.edges.push(new Edge(vec3.fromValues(20, 0, 0), vec3.fromValues(2000,0, 2000), 15));

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

    // check if will intersect with street
    // returns the new pruned line's intersection if so, null otherwise
    intersectsExistingStreet(startingPoint: vec3, endPoint: vec3, size: number) : Intersection {
        // check if proposed street intersects any existing edge
        for (let i: number = 0; i < this.edges.length; i++) {
            let currEdge = this.edges[i];
            // check if proposed street intersects this edge
            let proposedIntersection = currEdge.intersectsEdgeAt(startingPoint, endPoint, size);
            // if intersection exists, snap to the new intersection
            if (proposedIntersection != null) {
                return proposedIntersection;
            }
        }
        return null;
    }

    // check if edge is close to intersecting with another street
    // returns the new extended line's intersection if so, null otherwise
    extendSegment(startingPoint: vec3, endPoint: vec3, size: number, searchDist: number) : Intersection {
        // created extended line
        let proposedStreetDir = vec3.fromValues(endPoint[0]- startingPoint[0],
            endPoint[1]- startingPoint[1],
            endPoint[2]- startingPoint[2]);
        let dist = vec3.create();
        vec3.multiply(dist, [searchDist, searchDist, searchDist], proposedStreetDir);
        vec3.add(endPoint, endPoint, dist);
        // using the updated endpoint, test if now intersects any of the existing streets
        return this.intersectsExistingStreet(startingPoint,endPoint,size);
    }


    // adding an edge/road to the system
    // origin is current turtle's position
    // endPoint is the proposed endpoint
    // size is width of the road
    // end point is checked and returned
    addRoadToNetwork(startingPoint: vec3, endPoint: vec3, size: number) : vec3 {
        // look for the correct endpoint
        // LOCAL CONSTRAINTS
        // if two streets intersect, generate an intersection
        let pruneToIntersection = this.intersectsExistingStreet(startingPoint, endPoint, size);
        if (pruneToIntersection != null) {
            endPoint = pruneToIntersection.position;
        } else {
            // if the end point is close to an existing intersection, use that inter as endpoint
            let searchDist = 5;
            let nearInter = this.existsCloseIntersection(endPoint, size, searchDist);
            if (nearInter != null) {
                endPoint = nearInter.position;
            } else {
                // if close to intersecting a street, extend street to form an intersection
                let extendedInter = this.extendSegment(startingPoint, endPoint, size, searchDist);
                if (extendedInter != null) {
                    endPoint = extendedInter.position;
                }
            }
        }

        let newEdge = new Edge(startingPoint, endPoint, size);
        let endNode = new Intersection(endPoint, size);

        //push to our collections of intersections and edges
        this.edges.push(newEdge);
        this.intersections.push(endNode);

        return endPoint;
    }

    getVBO() {
        let col1Array: number[] = [];
        let col2Array: number[] = [];
        let col3Array: number[] = [];
        let col4Array: number[] = [];
        let colorsArray: number[] = [];

        for (var i = 0; i < this.edges.length; i++) {
            let currEdge = this.edges[i];
            let currTransform = currEdge.getTransform();
            console.log(currTransform);

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

    // checks if ths edge would intersect the edge passed in
    // returns the intersection if intersects, null otherwise
    intersectsEdgeAt(edgeStart: vec3, edgeEnd: vec3, size: number) : Intersection {
        let p0_x = this.startingPoint[0];
        let p0_y = this.startingPoint[2];
        let p1_x = this.endPoint[0];
        let p1_y = this.endPoint[2];

        let p2_x = edgeStart[0];
        let p2_y = edgeStart[2];
        let p3_x = edgeEnd[0];
        let p3_y = edgeEnd[2];

        let s1_x: number = p1_x - p0_x;
        let s1_y: number = p1_y - p0_y;
        let s2_x: number = p3_x - p2_x;
        let s2_y: number = p3_y - p2_y;

        let s: number = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
        let t: number = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            let x_result: number = p0_x + (t * s1_x);
            let y_Result: number = p0_y + (t * s1_y);
            return new Intersection(vec3.fromValues(x_result, 0, y_Result), size);
        }

        return null;
    }


    getTransform() {
        let up = vec3.fromValues(0, 0, 1);
        let dir: vec3 = vec3.fromValues(0, 0, 0);
        vec3.subtract(dir, this.endPoint, this.startingPoint);

        // get angle
        let x1 = up[0];
        let y1 = up[2];

        let x2 = dir[0];
        let y2 = dir[2];

        let angleRad = -Math.atan2(x1 * y2 - y1 * x2, x1 * x2 + y1 * y2);
        let rot = vec3.fromValues(0, 1, 0);
        let rotQuat = quat.create();
        quat.setAxisAngle(rotQuat, rot, angleRad);

        // mid point
        let x = this.startingPoint[0] + this.endPoint[0];
        let y = this.startingPoint[1] + this.endPoint[1];
        let z = this.startingPoint[2] + this.endPoint[2];
        let translate = vec3.fromValues(x / 2, y / 2, z / 2);
        let scaleVec = vec3.fromValues(this.size, 1, vec3.length(dir));

        let transformationMat: mat4 = mat4.create();
        mat4.fromRotationTranslationScale(transformationMat, rotQuat, translate, scaleVec);
        return transformationMat;
    }

}

export {LSystemRoad};
