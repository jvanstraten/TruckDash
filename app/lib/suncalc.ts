/*
 * This is https://github.com/mourner/suncalc, modified to work better with
 * typescript. Mohammad Al Shakoush did the bulk of this in 2022
 * (https://github.com/moalshak/suncalc.ts), then I (Jeroen van Straten) fixed
 * the remaining problems WebStorm was complaining about. I don't care what
 * you do with my modifications or whether I'm credited for them if you yank
 * this into your own project for some reason, but the original BSD copyright
 * notice has to survive:

Copyright (c) 2025, Vladimir Agafonkin
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

export interface GetSunTimesResult {
    solarNoon: Date;
    nadir: Date;
    dawn?: Date;
    dusk?: Date;
    goldenHour?: Date;
    goldenHourEnd?: Date;
    nauticalDawn?: Date;
    nauticalDusk?: Date;
    night?: Date;
    nightEnd?: Date;
    sunrise?: Date;
    sunriseEnd?: Date;
    sunset?: Date;
    sunsetStart?: Date;
}

export interface GetSunPositionResult {
    altitude: number;
    azimuth: number;
}

export interface GetMoonPositionResult {
    altitude: number;
    azimuth: number;
    distance: number;
    parallacticAngle: number;
}

export interface GetMoonIlluminationResult {
    fraction: number;
    phase: number;
    angle: number;
}

export interface GetMoonTimesResult {
    rise?: Date;
    set?: Date;
    alwaysUp?: true;
    alwaysDown?: true;
}

export default class SunCalc {
    getPosition(date: Date, lat: number, lng: number) {
        throw new Error('Method not implemented.');
    }
    // shortcuts for easier to read formulas
    PI = Math.PI;
    sin = Math.sin;
    cos = Math.cos;
    tan = Math.tan;
    asin = Math.asin;
    atan = Math.atan2;
    acos = Math.acos;
    rad = this.PI / 180;

    // date/time constants and conversions
    dayMs = 1000 * 60 * 60 * 24;
    J1970 = 2440588;
    J2000 = 2451545;
    J0 = 0.0009;

    e = this.rad * 23.4397; // obliquity of the Earth

    // sun times configuration (angle, morning name, evening name)

    public times: [number, string, string][] = [
        [-0.833, 'sunrise', 'sunset'],
        [-0.3, 'sunriseEnd', 'sunsetStart'],
        [-6, 'dawn', 'dusk'],
        [-12, 'nauticalDawn', 'nauticalDusk'],
        [-18, 'nightEnd', 'night'],
        [6, 'goldenHourEnd', 'goldenHour'],
    ];

    // sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

    toJulian(date: Date): number {
        return date.valueOf() / this.dayMs - 0.5 + this.J1970;
    }
    fromJulian(j: number): Date {
        return new Date((j + 0.5 - this.J1970) * this.dayMs);
    }
    toDays(date: Date): number {
        return this.toJulian(date) - this.J2000;
    }

    // general calculations for position

    rightAscension(l: number, b: number) {
        return this.atan(
            this.sin(l) * this.cos(this.e) - this.tan(b) * this.sin(this.e),
            this.cos(l),
        );
    }
    declination(l: number, b: number) {
        return this.asin(
            this.sin(b) * this.cos(this.e) +
            this.cos(b) * this.sin(this.e) * this.sin(l),
        );
    }

    azimuth(H: number, phi: number, dec: number) {
        return this.atan(
            this.sin(H),
            this.cos(H) * this.sin(phi) - this.tan(dec) * this.cos(phi),
        );
    }
    altitude(H: number, phi: number, dec: number) {
        return this.asin(
            this.sin(phi) * this.sin(dec) +
            this.cos(phi) * this.cos(dec) * this.cos(H),
        );
    }

    siderealTime(d: number, lw: number) {
        return this.rad * (280.16 + 360.9856235 * d) - lw;
    }

    astroRefraction(h: number) {
        if (h < 0)
            // the following formula works for positive altitudes only.
            h = 0; // if h = -0.08901179 a div/0 would occur.

        // formula 16.4 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
        // 1.02 / this.tan(h + 10.26 / (h + 5.10)) h in degrees, result in arc minutes -> converted to this.rad:
        return 0.0002967 / this.tan(h + 0.00312536 / (h + 0.08901179));
    }

    // general sun calculations

    solarMeanAnomaly(d: number) {
        return this.rad * (357.5291 + 0.98560028 * d);
    }

    eclipticLongitude(M: number) {
        const C =
                this.rad *
                (1.9148 * this.sin(M) +
                    0.02 * this.sin(2 * M) +
                    0.0003 * this.sin(3 * M)), // equation of center
            P = this.rad * 102.9372; // perihelion of the Earth

        return M + C + P + this.PI;
    }

    sunCoords(d: number) {
        const M = this.solarMeanAnomaly(d),
            L = this.eclipticLongitude(M);

        return {
            dec: this.declination(L, 0),
            ra: this.rightAscension(L, 0),
        };
    }

    // calculations for sun times

    julianCycle(d: number, lw: number) {
        return Math.round(d - this.J0 - lw / (2 * this.PI));
    }

    approxTransit(Ht: number, lw: number, n: number) {
        return this.J0 + (Ht + lw) / (2 * this.PI) + n;
    }
    solarTransitJ(ds: number, M: number, L: number) {
        return this.J2000 + ds + 0.0053 * this.sin(M) - 0.0069 * this.sin(2 * L);
    }

    hourAngle(h: number, phi: number, d: number) {
        return this.acos(
            (this.sin(h) - this.sin(phi) * this.sin(d)) /
            (this.cos(phi) * this.cos(d)),
        );
    }
    observerAngle(height: number) {
        return (-2.076 * Math.sqrt(height)) / 60;
    }

    // returns set time for the given sun altitude
    getSetJ(h: number, lw: number, phi: number, dec: number, n: number, M: number, L: number) {
        const w = this.hourAngle(h, phi, dec),
            a = this.approxTransit(w, lw, n);
        return this.solarTransitJ(a, M, L);
    }

    // moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

    moonCoords(d: number) {
        // geocentric ecliptic coordinates of the moon

        const L = this.rad * (218.316 + 13.176396 * d), // ecliptic longitude
            M = this.rad * (134.963 + 13.064993 * d), // mean anomaly
            F = this.rad * (93.272 + 13.22935 * d), // mean distance
            l = L + this.rad * 6.289 * this.sin(M), // longitude
            b = this.rad * 5.128 * this.sin(F), // latitude
            dt = 385001 - 20905 * this.cos(M); // distance to the moon in km

        return {
            ra: this.rightAscension(l, b),
            dec: this.declination(l, b),
            dist: dt,
        };
    }

    hoursLater(date: Date, h: number) {
        return new Date(date.valueOf() + (h * this.dayMs) / 24);
    }

    // calculates sun times for a given date, latitude/longitude, and, optionally,
    // the observer height (in meters) relative to the horizon



    public getTimes(date: Date, lat: number, lng: number, height: number): GetSunTimesResult {
        height = height || 0;

        const lw = this.rad * -lng,
            phi = this.rad * lat,
            dh = this.observerAngle(height),
            d = this.toDays(date),
            n = this.julianCycle(d, lw),
            ds = this.approxTransit(0, lw, n),
            M = this.solarMeanAnomaly(ds),
            L = this.eclipticLongitude(M),
            dec = this.declination(L, 0),
            Jnoon = this.solarTransitJ(ds, M, L);

        let i,
            len,
            time,
            h0,
            Jset,
            Jrise;

        const result: GetSunTimesResult = {
            solarNoon: this.fromJulian(Jnoon),
            nadir: this.fromJulian(Jnoon - 0.5)
        };

        for (time in this.times) {
            // @ts-ignore
            h0 = (time[0] + dh) * this.rad;

            Jset = this.getSetJ(h0, lw, phi, dec, n, M, L);
            Jrise = Jnoon - (Jset - Jnoon);

            // @ts-ignore
            result[time[1]] = this.fromJulian(Jrise);
            // @ts-ignore
            result[time[2]] = this.fromJulian(Jset);
        }

        return result;
    }

    /**
     * calculates sun position for a given date and latitude/longitude
     * @param  {Date} date
     * @param  {Number} lat
     * @param  {Number} lng
     */
    public getSunPosition(date: Date, lat: number, lng: number): GetSunPositionResult {
        const lw = this.rad * -lng,
            phi = this.rad * lat,
            d = this.toDays(date),
            c = this.sunCoords(d),
            H = this.siderealTime(d, lw) - c.ra;

        const result: GetSunPositionResult = {
            azimuth: this.azimuth(H, phi, c.dec),
            altitude: this.altitude(H, phi, c.dec),
        };

        return result;
    };

    /**
     * adds a custom time to the times config
     *
     * @param angle
     * @param riseName
     * @param setName
     */

    public addTime(angle: number, riseName: string, setName: string): void {
        this.times.push([angle, riseName, setName]);
    }

    /**
     * calculates moon position for a given date and latitude/longitude
     * @param  {Date} date
     * @param  {Number} lat
     * @param  {Number} lng
     * @return {Object} containing azimuth, altitude and distance
     */
    public getMoonPosition(date: Date, lat: number, lng: number): GetMoonPositionResult {
        const lw = this.rad * -lng,
            phi = this.rad * lat,
            d = this.toDays(date),
            c = this.moonCoords(d),
            H = this.siderealTime(d, lw) - c.ra,
            // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
            pa = this.atan(
                this.sin(H),
                this.tan(phi) * this.cos(c.dec) - this.sin(c.dec) * this.cos(H),
            );

        let h = this.altitude(H, phi, c.dec);

        h = h + this.astroRefraction(h); // altitude correction for refraction

        const result: GetMoonPositionResult = {
            azimuth: this.azimuth(H, phi, c.dec),
            altitude: h,
            distance: c.dist,
            parallacticAngle: pa,
        }

        return result;
    }

    /**
     * calculations for illumination parameters of the moon,
     * based on http://idlastro.gsfc.nasa.gov/ftp/pro/astro/mphase.pro formulas and
     *   Chapter 48 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.
     * @param {Date} date
     * @returns
     */

    public getMoonIllumination(date: Date): GetMoonIlluminationResult {
        const d = this.toDays(date || new Date()),
            s = this.sunCoords(d),
            m = this.moonCoords(d),
            sdist = 149598000, // distance from Earth to Sun in km
            phi = this.acos(
                this.sin(s.dec) * this.sin(m.dec) +
                this.cos(s.dec) * this.cos(m.dec) * this.cos(s.ra - m.ra),
            ),
            inc = this.atan(sdist * this.sin(phi), m.dist - sdist * this.cos(phi)),
            angle = this.atan(
                this.cos(s.dec) * this.sin(s.ra - m.ra),
                this.sin(s.dec) * this.cos(m.dec) -
                this.cos(s.dec) * this.sin(m.dec) * this.cos(s.ra - m.ra),
            );
        const result: GetMoonIlluminationResult = {
            fraction: (1 + this.cos(inc)) / 2,
            phase: 0.5 + (0.5 * inc * (angle < 0 ? -1 : 1)) / Math.PI,
            angle: angle,
        };

        return result;
    }

    /**
     * calculations for moon rise/set times are based on http://www.stargazing.net/kepler/moonrise.html article
     * @param date
     * @param lat
     * @param lng
     * @param inUTC
     * @returns
     */

    public getMoonTimes(date: Date, lat: number, lng: number, inUTC?: boolean): GetMoonTimesResult {
        const t = new Date(date);
        if (inUTC) t.setUTCHours(0, 0, 0, 0);
        else t.setHours(0, 0, 0, 0);

        const hc = 0.133 * this.rad;
        let h0 = this.getMoonPosition(t, lat, lng).altitude - hc,
            h1,
            h2,
            rise,
            set,
            a,
            b,
            xe,
            ye = 0,
            d,
            roots,
            x1 = 0,
            x2 = 0,
            dx;

        // go in 2-hour chunks, each time seeing if a 3-point quadratic curve crosses zero (which means rise or set)
        for (let i = 1; i <= 24; i += 2) {
            h1 = this.getMoonPosition(this.hoursLater(t, i), lat, lng).altitude - hc;
            h2 =
                this.getMoonPosition(this.hoursLater(t, i + 1), lat, lng).altitude - hc;

            a = (h0 + h2) / 2 - h1;
            b = (h2 - h0) / 2;
            xe = -b / (2 * a);
            ye = (a * xe + b) * xe + h1;
            d = b * b - 4 * a * h1;
            roots = 0;

            if (d >= 0) {
                dx = Math.sqrt(d) / (Math.abs(a) * 2);
                x1 = xe - dx;
                x2 = xe + dx;
                if (Math.abs(x1) <= 1) roots++;
                if (Math.abs(x2) <= 1) roots++;
                if (x1 < -1) x1 = x2;
            }

            if (roots === 1) {
                if (h0 < 0) rise = i + x1;
                else set = i + x1;
            } else if (roots === 2) {
                rise = i + (ye < 0 ? x2 : x1);
                set = i + (ye < 0 ? x1 : x2);
            }

            if (rise && set) break;

            h0 = h2;
        }

        const result: GetMoonTimesResult = {};

        if (rise) result.rise = this.hoursLater(t, rise);
        if (set) result.set = this.hoursLater(t, set);

        if (!rise && !set) result[ye > 0 ? 'alwaysUp' : 'alwaysDown'] = true;

        return result;
    }
}
