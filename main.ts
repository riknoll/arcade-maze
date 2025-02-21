//% block=Maze
//% color="#6e231e"
namespace mazegen {
    export enum Location {
        //% block="anywhere"
        Anywhere = 0,
        //% block="top left"
        TopLeft = 1 << 0,
        //% block="top right"
        TopRight = 1 << 1,
        //% block="bottom left"
        BottomLeft = 1 << 2,
        //% block="bottom right"
        BottomRight = 1 << 3,
        //% block="left side"
        LeftSide = 1 << 4,
        //% block="top side"
        TopSide = 1 << 5,
        //% block="right side"
        RightSide = 1 << 6,
        //% block="bottom side"
        BottomSide = 1 << 7,
        //% block="center"
        Center = 1 << 8
    }

    /**
     * Generates an Image that contains a maze. The entrance and exit will be
     * indicated with pixels of a different color. Transparent pixels indicate
     * walls in the maze
     *
     * @param width The width of the output image in pixels. Odd number work best
     * @param height The height of the output image in pixels. Odd numbers work bet
     * @param entranceRule The location for the entrance pixel to be placed
     * @param exitRule The location for the entrance pixel to be placed
     * @param startColor The color of the entrance pixel. This is 7 (green) by default
     * @param endColor The color of the exit pixel. This is 2 (red) by default
     * @param defaultColor The color of all of the filled pixels other than the entrance and exit. This is 1 (white) by default
     * @param seed A seed to be placed
     * @returns An image with a maze in it
     */
    //% blockId=mazegen_create
    //% block="create maze|width $width|height $height||entrance $entranceRule|exit $exitRule|entrance color $startColor|exit color $endColor|default color $defaultColor|seed $seed"
    //% width.defl=9
    //% height.defl=9
    //% entranceRule.shadow=mazegen__location
    //% exitRule.shadow=mazegen__location
    //% startColor.shadow=colorindexpicker
    //% startColor.defl=7
    //% endColor.shadow=colorindexpicker
    //% endColor.defl=2
    //% defaultColor.shadow=colorindexpicker
    //% defaultColor.defl=1
    //% weigt=100
    export function create(
        width: number,
        height: number,
        entranceRule?: number,
        exitRule?: number,
        startColor?: number,
        endColor?: number,
        defaultColor?: number,
        seed?: number
    ): Image {
        width |= 0;
        height |= 0;
        if (!entranceRule) entranceRule = Location.Anywhere;
        if (!exitRule) exitRule = Location.Anywhere;
        if (!startColor) startColor = 7;
        if (!endColor) endColor = 2;
        if (!defaultColor) defaultColor = 1;
        if (!seed) seed = randint(0, 0xffffff);

        if (entranceRule === exitRule) {
            switch (entranceRule) {
                case Location.TopLeft:
                case Location.TopRight:
                case Location.BottomLeft:
                case Location.BottomRight:
                case Location.Center:
                    throw "Incompatible entrance and exit option";
            }
        }

        if (width <= 2 || height <= 2) {
            throw "Invalid width/height";
        }

        const random = new Math.FastRandom(seed);
        const result = image.create(width, height);

        const halfWidth = Math.ceil(width / 2)
        const halfHeight = Math.ceil(height / 2);

        for (let x = 0; x < halfWidth; x++) {
            for (let y = 0; y < halfHeight; y++) {
                result.setPixel(
                    x << 1,
                    y << 1,
                    1
                );
            }
        }

        const flipEntranceExit = !isExactLocation(entranceRule) && isExactLocation(exitRule)
        let startLocation = getEntrance(width, height, flipEntranceExit ? exitRule : entranceRule, random);

        const stack: number[] = [startLocation];
        let maxDistance = 0;
        let endLocation = startLocation;

        result.setPixel(XX(startLocation) << 1, YY(startLocation) << 1, 2);

        const checkLocation = (current: number, dx: number, dy: number) => {
            const next = pack(XX(current) + dx, YY(current) + dy, ZZ(current) + 1);
            if (result.getPixel(XX(next) << 1, YY(next) << 1) === 1) {
                result.setPixel(XX(next) << 1, YY(next) << 1, 2);
                result.setPixel((XX(current) << 1) + dx, (YY(current) << 1) + dy, 2);

                stack.push(current);
                stack.push(next);

                if (validExit(next, width, height, flipEntranceExit ? entranceRule : exitRule) && ZZ(next) > maxDistance) {
                    maxDistance = ZZ(next);
                    endLocation = next;
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

        let flip = 0;
        if (!(width & 1)) {
            for (let y = 0; y < height; y += 2) {
                if (result.getPixel(width - 2, y)) {
                    if (
                        result.getPixel(width - 2, y + 1) &&
                        result.getPixel(width - 2, y + 2)
                    ) {
                        if (random.percentChance(80)) {
                            flip++
                        }
                        if ((flip % 3) === 0) {
                            result.setPixel(width - 1, y, defaultColor)
                            result.setPixel(width - 2, y + 1, 0)
                            result.setPixel(width - 1, y + 1, defaultColor)
                            result.setPixel(width - 1, y + 2, defaultColor)
                            continue;
                        }
                    }

                    result.setPixel(width - 1, y, defaultColor)
                }
            }
        }

        if (!(height & 1)) {
            for (let x = 0; x < width; x += 2) {
                if (result.getPixel(x, height - 2)) {
                    if (
                        result.getPixel(x + 1, height - 2) &&
                        result.getPixel(x + 2, height - 2)
                    ) {
                        if (random.percentChance(80)) {
                            flip++
                        }
                        if ((flip % 3) === 0) {
                            result.setPixel(x, height - 1, defaultColor)
                            result.setPixel(x + 1, height - 2, 0)
                            result.setPixel(x + 1, height - 1, defaultColor)
                            result.setPixel(x + 2, height - 1, defaultColor)
                            continue;
                        }
                    }

                    result.setPixel(x, height - 1, defaultColor)
                }
            }
        }

        result.replace(2, 1);
        result.replace(1, defaultColor);

        if (flipEntranceExit) {
            const swap = startLocation;
            startLocation = endLocation;
            endLocation = swap;
        }

        let entranceX = XX(startLocation) << 1;
        let entranceY = YY(startLocation) << 1;
        let exitX = XX(endLocation) << 1;
        let exitY = YY(endLocation) << 1;


        if (
            !(width & 1) &&
            isOnRightSide(entranceRule) &&
            result.getPixel(entranceX + 1, entranceY)
        ) {
            entranceX++;
        }

        if (
            !(height & 1) &&
            isOnBottomSide(entranceRule) &&
            result.getPixel(entranceX, entranceY + 1)
        ) {
            entranceY++;
        }

        if (
            !(width & 1) &&
            isOnRightSide(exitRule) &&
            result.getPixel(exitX + 1, exitY)
        ) {
            exitX++;
        }

        if (
            !(height & 1) &&
            isOnBottomSide(exitRule) &&
            result.getPixel(exitX, exitY + 1)
        ) {
            exitY++;
        }

        result.setPixel(entranceX, entranceY, startColor);
        result.setPixel(exitX, exitY, endColor);

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
        const maxX = Math.ceil(width / 2) - 1;
        const maxY = Math.ceil(height / 2) - 1;
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
            case Location.Center:
                return pack(maxX >> 1, maxY >> 1, 0);
        }
        return 0;
    }

    function validExit(loc: number, width: number, height: number, location: Location) {
        const maxX = Math.ceil(width / 2) - 1;
        const maxY = Math.ceil(height / 2) - 1;

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
        return false;
    }

    function isOnRightSide(location: Location) {
        return !!(location & (Location.TopRight | Location.BottomRight | Location.RightSide));
    }

    function isOnBottomSide(location: Location) {
        return !!(location & (Location.BottomLeft | Location.BottomRight | Location.BottomSide));
    }

    function isExactLocation(location: Location) {
        return !!(location & (Location.TopLeft | Location.TopRight | Location.BottomLeft | Location.BottomRight | Location.Center))
    }
}