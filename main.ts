namespace mazegen {
    export enum Location {
        //% block="anywhere"
        Anywhere,
        //% block="top left"
        TopLeft,
        //% block="top right"
        TopRight,
        //% block="bottom left"
        BottomLeft,
        //% block="bottom right"
        BottomRight,
        //% block="left side"
        LeftSide,
        //% block="top side"
        TopSide,
        //% block="right side"
        RightSide,
        //% block="bottom side"
        BottomSide,
        //% block="center"
        Center
    }

    //% blockId=mazegen_create
    //% block="create maze|width $width|height $height||entrance $entrance|exit $exit|entrance color $startColor|exit color $endColor|default color $defaultColor|seed $seed"
    //% entrance.shadow=mazegen__location
    //% exit.shadow=mazegen__location
    export function create(
        width: number,
        height: number,
        entrance?: number,
        exit?: number,
        startColor?: number,
        endColor?: number,
        defaultColor?: number,
        seed?: number
    ): Image {
        width |= 0;
        height |= 0;
        if (!entrance) entrance = Location.Anywhere;
        if (!exit) exit = Location.Anywhere;
        if (!startColor) startColor = 7;
        if (!endColor) endColor = 2;
        if (!defaultColor) defaultColor = 1;
        if (seed == null) seed = randint(0, 0xffffff);

        if (entrance === exit) {
            switch (entrance) {
                case Location.TopLeft:
                case Location.TopRight:
                case Location.BottomLeft:
                case Location.BottomRight:
                case Location.Center:
                    throw "Incompatible entrance and exit option";
            }
        }

        if (width <= 1 || height <= 1) {
            throw "Invalid width/height";
        }

        const random = new Math.FastRandom(seed);
        const result = image.create(width, height);

        const halfWidth = width >> 1;
        const halfHeight = height >> 1;

        for (let x = 0; x < halfWidth; x++) {
            for (let y = 0; y < halfHeight; y++) {
                result.setPixel(
                    x << 1,
                    y << 1,
                    1
                );
            }
        }

        const start = getEntrance(width, height, entrance, random);

        const stack: number[] = [start];
        let maxDistance = 0;
        let end = start;

        result.setPixel(XX(start) << 1, YY(start) << 1, 2);

        const checkLocation = (current: number, dx: number, dy: number) => {
            const next = pack(XX(current) + dx, YY(current) + dy, ZZ(current) + 1);
            if (result.getPixel(XX(next) << 1, YY(next) << 1) === 1) {
                result.setPixel(XX(next) << 1, YY(next) << 1, 2);
                result.setPixel((XX(current) << 1) + dx, (YY(current) << 1) + dy, 2);

                stack.push(current);
                stack.push(next);

                if (validExit(next, width, height, exit) && ZZ(next) > maxDistance) {
                    maxDistance = ZZ(next);
                    end = next;
                }
                return true;
            }
            return false;
        }

        while (stack.length) {
            const current = stack.pop();

            let direction = random.randomRange(0, 3);
            for (let i = 0; i < 4; i++) {
                if (direction === 0) {
                    if (checkLocation(current, 0, -1)) break;
                }
                else if (direction === 1) {
                    if (checkLocation(current, 1, 0)) break;
                }
                else if (direction === 2) {
                    if (checkLocation(current, 0, 1)) break;
                }
                else {
                    if (checkLocation(current, -1, 0)) break;
                }

                direction = (direction + 1) % 4;
            }
        }

        result.replace(2, 1);
        result.replace(1, defaultColor);
        result.setPixel(XX(start) << 1, YY(start) << 1, startColor);
        result.setPixel(XX(end) << 1, YY(end) << 1, endColor);

        return result;
    }

    //% shim=TD_ID
    //% blockId=mazegen__location
    //% block="$location"
    export function _location(location: Location): number {
        return location;
    }

    function pack(x: number, y: number, z: number) {
        return (x & 0xff) | ((y & 0xff) << 8) | ((z & 0xffff) << 16)
    }

    function XX(x: number) { return x & 0xff }
    function YY(x: number) { return (x >> 8) & 0xff }
    function ZZ(x: number) { return x >> 16 }

    function getEntrance(width: number, height: number, location: Location, random: Math.FastRandom) {
        const maxX = (width >> 1) - 1;
        const maxY = (height >> 1) - 1;
        const randX = random.randomRange(0, maxX);
        const randY = random.randomRange(0, maxY);

        switch (location) {
            case Location.Anywhere:
                return pack(randX, randY, 0);
            case Location.TopLeft:
                return pack(0, 0, 0);
            case Location.TopRight:
                return pack(maxX, 0, 0);
            case Location.BottomLeft:
                return pack(0, maxY, 0);
            case Location.BottomRight:
                return pack(maxX, maxY, 0);
            case Location.LeftSide:
                return pack(0, randY, 0);
            case Location.TopSide:
                return pack(randX, 0, 0);
            case Location.RightSide:
                return pack(maxX, randY, 0);
            case Location.BottomSide:
                return pack(randX, maxY, 0);
            case Location.Center :
                return pack(maxX >> 1, maxY >> 1, 0);
        }
    }

    function validExit(loc: number, width: number, height: number, location: Location) {
        const maxX = (width >> 1) - 1;
        const maxY = (height >> 1) - 1;

        switch (location) {
            case Location.Anywhere:
                return true;
            case Location.TopLeft:
                return XX(loc) === 0 && YY(loc) === 0;
            case Location.TopRight:
                return XX(loc) === maxX && YY(loc) === 0;
            case Location.BottomLeft:
                return XX(loc) === 0 && YY(loc) === maxY;
            case Location.BottomRight:
                return XX(loc) === maxX && YY(loc) === maxY;
            case Location.LeftSide:
                return XX(loc) === 0;
            case Location.TopSide:
                return YY(loc) == 0;
            case Location.RightSide:
                return XX(loc) === maxX;
            case Location.BottomSide:
                return YY(loc) === maxY;
            case Location.Center:
                return XX(loc) === maxX >> 1 && YY(loc) === maxY >> 1;
        }
    }
}