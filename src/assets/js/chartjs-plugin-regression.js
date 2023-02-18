(() => {
    var t = {
        254: function (t, e) {
            var r, n;
            void 0 === (n = "function" == typeof (r = function (t) {
                "use strict";
                var e = Object.assign || function (t) {
                    for (var e = 1; e < arguments.length; e++) {
                        var r = arguments[e];
                        for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (t[n] = r[n])
                    }
                    return t
                };

                function r(t) {
                    if (Array.isArray(t)) {
                        for (var e = 0, r = Array(t.length); e < t.length; e++) r[e] = t[e];
                        return r
                    }
                    return Array.from(t)
                }

                var n = {order: 2, precision: 2, period: null};

                function i(t, e) {
                    var r = [], n = [];
                    t.forEach((function (t, i) {
                        null !== t[1] && (n.push(t), r.push(e[i]))
                    }));
                    var i = n.reduce((function (t, e) {
                        return t + e[1]
                    }), 0) / n.length, o = n.reduce((function (t, e) {
                        var r = e[1] - i;
                        return t + r * r
                    }), 0);
                    return 1 - n.reduce((function (t, e, n) {
                        var i = r[n], o = e[1] - i[1];
                        return t + o * o
                    }), 0) / o
                }

                function o(t, e) {
                    var r = Math.pow(10, e);
                    return Math.round(t * r) / r
                }

                var a = {
                    linear: function (t, e) {
                        for (var r = [0, 0, 0, 0, 0], n = 0, a = 0; a < t.length; a++) null !== t[a][1] && (n++, r[0] += t[a][0], r[1] += t[a][1], r[2] += t[a][0] * t[a][0], r[3] += t[a][0] * t[a][1], r[4] += t[a][1] * t[a][1]);
                        var s = n * r[2] - r[0] * r[0], c = n * r[3] - r[0] * r[1],
                            u = 0 === s ? 0 : o(c / s, e.precision), l = o(r[1] / n - u * r[0] / n, e.precision),
                            p = function (t) {
                                return [o(t, e.precision), o(u * t + l, e.precision)]
                            }, h = t.map((function (t) {
                                return p(t[0])
                            }));
                        return {
                            points: h,
                            predict: p,
                            equation: [u, l],
                            r2: o(i(t, h), e.precision),
                            string: 0 === l ? "y = " + u + "x" : "y = " + u + "x + " + l
                        }
                    }, exponential: function (t, e) {
                        for (var r = [0, 0, 0, 0, 0, 0], n = 0; n < t.length; n++) null !== t[n][1] && (r[0] += t[n][0], r[1] += t[n][1], r[2] += t[n][0] * t[n][0] * t[n][1], r[3] += t[n][1] * Math.log(t[n][1]), r[4] += t[n][0] * t[n][1] * Math.log(t[n][1]), r[5] += t[n][0] * t[n][1]);
                        var a = r[1] * r[2] - r[5] * r[5], s = Math.exp((r[2] * r[3] - r[5] * r[4]) / a),
                            c = (r[1] * r[4] - r[5] * r[3]) / a, u = o(s, e.precision), l = o(c, e.precision),
                            p = function (t) {
                                return [o(t, e.precision), o(u * Math.exp(l * t), e.precision)]
                            }, h = t.map((function (t) {
                                return p(t[0])
                            }));
                        return {
                            points: h,
                            predict: p,
                            equation: [u, l],
                            string: "y = " + u + "e^(" + l + "x)",
                            r2: o(i(t, h), e.precision)
                        }
                    }, logarithmic: function (t, e) {
                        for (var r = [0, 0, 0, 0], n = t.length, a = 0; a < n; a++) null !== t[a][1] && (r[0] += Math.log(t[a][0]), r[1] += t[a][1] * Math.log(t[a][0]), r[2] += t[a][1], r[3] += Math.pow(Math.log(t[a][0]), 2));
                        var s = o((n * r[1] - r[2] * r[0]) / (n * r[3] - r[0] * r[0]), e.precision),
                            c = o((r[2] - s * r[0]) / n, e.precision), u = function (t) {
                                return [o(t, e.precision), o(o(c + s * Math.log(t), e.precision), e.precision)]
                            }, l = t.map((function (t) {
                                return u(t[0])
                            }));
                        return {
                            points: l,
                            predict: u,
                            equation: [c, s],
                            string: "y = " + c + " + " + s + " ln(x)",
                            r2: o(i(t, l), e.precision)
                        }
                    }, power: function (t, e) {
                        for (var r = [0, 0, 0, 0, 0], n = t.length, a = 0; a < n; a++) null !== t[a][1] && (r[0] += Math.log(t[a][0]), r[1] += Math.log(t[a][1]) * Math.log(t[a][0]), r[2] += Math.log(t[a][1]), r[3] += Math.pow(Math.log(t[a][0]), 2));
                        var s = (n * r[1] - r[0] * r[2]) / (n * r[3] - Math.pow(r[0], 2)), c = (r[2] - s * r[0]) / n,
                            u = o(Math.exp(c), e.precision), l = o(s, e.precision), p = function (t) {
                                return [o(t, e.precision), o(o(u * Math.pow(t, l), e.precision), e.precision)]
                            }, h = t.map((function (t) {
                                return p(t[0])
                            }));
                        return {
                            points: h,
                            predict: p,
                            equation: [u, l],
                            string: "y = " + u + "x^" + l,
                            r2: o(i(t, h), e.precision)
                        }
                    }, polynomial: function (t, e) {
                        for (var n = [], a = [], s = 0, c = 0, u = t.length, l = e.order + 1, p = 0; p < l; p++) {
                            for (var h = 0; h < u; h++) null !== t[h][1] && (s += Math.pow(t[h][0], p) * t[h][1]);
                            n.push(s), s = 0;
                            for (var f = [], d = 0; d < l; d++) {
                                for (var v = 0; v < u; v++) null !== t[v][1] && (c += Math.pow(t[v][0], p + d));
                                f.push(c), c = 0
                            }
                            a.push(f)
                        }
                        a.push(n);
                        for (var y = function (t, e) {
                            for (var r = t, n = t.length - 1, i = [e], o = 0; o < n; o++) {
                                for (var a = o, s = o + 1; s < n; s++) Math.abs(r[o][s]) > Math.abs(r[o][a]) && (a = s);
                                for (var c = o; c < n + 1; c++) {
                                    var u = r[c][o];
                                    r[c][o] = r[c][a], r[c][a] = u
                                }
                                for (var l = o + 1; l < n; l++) for (var p = n; p >= o; p--) r[p][l] -= r[p][o] * r[o][l] / r[o][o]
                            }
                            for (var h = n - 1; h >= 0; h--) {
                                for (var f = 0, d = h + 1; d < n; d++) f += r[d][h] * i[d];
                                i[h] = (r[n][h] - f) / r[h][h]
                            }
                            return i
                        }(a, l).map((function (t) {
                            return o(t, e.precision)
                        })), g = function (t) {
                            return [o(t, e.precision), o(y.reduce((function (e, r, n) {
                                return e + r * Math.pow(t, n)
                            }), 0), e.precision)]
                        }, x = t.map((function (t) {
                            return g(t[0])
                        })), m = "y = ", b = y.length - 1; b >= 0; b--) m += b > 1 ? y[b] + "x^" + b + " + " : 1 === b ? y[b] + "x + " : y[b];
                        return {
                            string: m,
                            points: x,
                            predict: g,
                            equation: [].concat(r(y)).reverse(),
                            r2: o(i(t, x), e.precision)
                        }
                    }
                };
                t.exports = Object.keys(a).reduce((function (t, r) {
                    return e({_round: o}, t, (c = function (t, i) {
                        return a[r](t, e({}, n, i))
                    }, (s = r) in (i = {}) ? Object.defineProperty(i, s, {
                        value: c,
                        enumerable: !0,
                        configurable: !0,
                        writable: !0
                    }) : i[s] = c, i));
                    var i, s, c
                }), {})
            }) ? r.apply(e, [t]) : r) || (t.exports = n)
        }, 642: (t, e, r) => {
            "use strict";
            Object.defineProperty(e, "__esModule", {value: !0}), e.MetaDataSet = void 0;
            var n = r(67), i = function () {
                function t(t, e) {
                    this.getXY = void 0, this.isXY = !1;
                    var r = e.regressions;
                    this.chart = t, this.dataset = e, this.normalizedData = this._normalizeData(e.data), this.sections = this._createMetaSections(r), this._calculate()
                }

                return t.prototype._normalizeData = function (t) {
                    var e = this;
                    return t.map((function (t, r) {
                        var n;
                        return "number" == typeof t || null == t || void 0 === t ? n = [r, t] : (e.isXY = !0, n = [t.x, t.y]), n
                    }))
                }, t.prototype._createMetaSections = function (t) {
                    var e = this;
                    return (t.sections || [{startIndex: 0, endIndex: this.dataset.data.length - 1}]).map((function (t) {
                        return new n.MetaSection(t, e)
                    }))
                }, t.prototype._calculate = function () {
                    this.sections.forEach((function (t) {
                        return t.calculate()
                    }))
                }, t.prototype.adjustScales = function () {
                    if (void 0 === this.topY) {
                        var t, e, r = this.chart.scales;
                        Object.keys(r).forEach((function (n) {
                            return "x" == n[0] && (t = r[n]) || (e = r[n])
                        })), this.topY = e.top, this.bottomY = e.bottom, this.getXY = function (r, n) {
                            return {x: t.getPixelForValue(r, void 0, void 0, !0), y: e.getPixelForValue(n)}
                        }
                    }
                }, t.prototype.drawRegressions = function () {
                    var t = this.chart.ctx;
                    t.save();
                    try {
                        this.sections.forEach((function (e) {
                            return e.drawRegressions(t)
                        }))
                    } finally {
                        t.restore()
                    }
                }, t.prototype.drawRightBorders = function () {
                    var t = this.chart.ctx;
                    t.save();
                    try {
                        for (var e = 0; e < this.sections.length - 1; e++) this.sections[e].drawRightBorder(t)
                    } finally {
                        t.restore()
                    }
                }, t
            }();
            e.MetaDataSet = i
        }, 67: (t, e, r) => {
            "use strict";
            Object.defineProperty(e, "__esModule", {value: !0}), e.MetaSection = void 0;
            var n = r(254), i = {
                type: "linear",
                calculation: {precision: 2, order: 2},
                line: {width: 2, color: "#000", dash: []},
                extendPredictions: !1,
                copy: {overwriteData: "none"}
            }, o = function () {
                function t(t, e) {
                    this._meta = e;
                    var r, n, o, a, s = e.chart, c = e.dataset,
                        u = (r = ["type", "calculation", "line", "extendPredictions", "copy"], a = (n = s.config.options) && (o = n.plugins) && o.regressions || {}, function t(e) {
                            for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
                            var i = {};
                            return e.forEach((function (e) {
                                r.forEach((function (r) {
                                    var n = r[e], o = typeof n;
                                    "undefined" != o && (Array.isArray(n) || "object" != o || null == n ? i[e] = n : i[e] = Object.assign({}, i[e], t(Object.keys(n), n)))
                                }))
                            })), i
                        }(r, i, a, c.regressions, t));
                    this.startIndex = t.startIndex || 0, this.endIndex = t.endIndex || c.data.length - 1, this.type = Array.isArray(u.type) ? u.type : [u.type], this.line = u.line, this.calculation = u.calculation, this.extendPredictions = u.extendPredictions, this.copy = u.copy, this.label = t.label || this._meta.chart.data.labels[this.endIndex], this._validateType()
                }

                return t.prototype._validateType = function () {
                    if (this.type.length > 1 && this.type.includes("copy")) throw Error("Invalid regression type:" + this.type + '. "none" cannot be combined with other type!')
                }, t.prototype.calculate = function () {
                    var t = this._meta.normalizedData.slice(this.startIndex, this.endIndex + 1);
                    "copy" == this.type[0] ? this._calculateCopySection(t) : this._calculateBestR2(t)
                }, t.prototype._calculateBestR2 = function (t) {
                    var e = this;
                    this.result = this.type.reduce((function (r, i) {
                        var o = Object.assign({}, e.calculation), a = i;
                        /polynomial[34]$/.test(i) && (o.order = parseInt(i.substr(10)), a = i.substr(0, 10));
                        var s = n[a](t, o);
                        return s.type = i, !r || r.r2 < s.r2 ? s : r
                    }), null)
                }, t.prototype._calculateCopySection = function (t) {
                    var e = this, r = this._meta.sections[this.copy.fromSectionIndex],
                        n = this.result = Object.assign({}, r.result), i = this.copy.overwriteData,
                        o = this._meta.normalizedData;
                    if (n.points = t.map((function (t) {
                        return n.predict(t[0])
                    })), delete n.r2, "none" != i) {
                        var a = this._meta.dataset.data, s = this._meta.isXY;
                        n.points.forEach((function (t, n) {
                            var c = t[0], u = t[1], l = n + e.startIndex;
                            (l < r.startIndex || l > r.endIndex) && ("all" == i || "last" == i && l == e.endIndex || "empty" == i && !o[l]) && (e.copy.maxValue && (u = Math.min(e.copy.maxValue, u)), void 0 !== e.copy.minValue && (u = Math.max(e.copy.minValue, u)), a[l] = s ? {
                                x: c,
                                y: u
                            } : u)
                        }))
                    }
                }, t.prototype.drawRightBorder = function (t) {
                    t.beginPath(), this._setLineAttrs(t), t.setLineDash([10, 2]), t.lineWidth = 2;
                    var e = this._meta.getXY(this.endIndex, 0);
                    t.moveTo(e.x, this._meta.topY), t.lineTo(e.x, this._meta.bottomY), t.fillStyle = this.line.color, t.fillText(this.label, e.x, this._meta.topY), t.stroke()
                }, t.prototype.drawRegressions = function (t) {
                    for (var e = 0, r = this._meta.sections.length; e < r; e++) {
                        var n = this._meta.sections[e], i = n == this;
                        if ((i && "copy" != this.type[0] || !i && this.extendPredictions) && n.drawRange(t, this.startIndex, this.endIndex, !i), i) break
                    }
                }, t.prototype.drawRange = function (t, e, r, n) {
                    var i = this;
                    t.beginPath(), this._setLineAttrs(t), n && t.setLineDash([5, 5]);
                    var o = this.result.predict, a = function (t) {
                        return i._meta.getXY(t, o(t)[1])
                    }, s = a(e);
                    t.moveTo(s.x, s.y);
                    for (var c = e + 1; c <= r; c++) s = a(c), t.lineTo(s.x, s.y);
                    t.stroke()
                }, t.prototype._setLineAttrs = function (t) {
                    this.line.width && (t.lineWidth = this.line.width), this.line.color && (t.strokeStyle = this.line.color), this.line.dash && t.setLineDash(this.line.dash)
                }, t
            }();
            e.MetaSection = o
        }, 856: function (t, e, r) {
            "use strict";
            var n = this && this.__createBinding || (Object.create ? function (t, e, r, n) {
                void 0 === n && (n = r), Object.defineProperty(t, n, {
                    enumerable: !0, get: function () {
                        return e[r]
                    }
                })
            } : function (t, e, r, n) {
                void 0 === n && (n = r), t[n] = e[r]
            }), i = this && this.__exportStar || function (t, e) {
                for (var r in t) "default" === r || e.hasOwnProperty(r) || n(e, t, r)
            };
            Object.defineProperty(e, "__esModule", {value: !0}), i(r(491), e), i(r(642), e), i(r(67), e), i(r(545), e)
        }, 545: (t, e, r) => {
            "use strict";
            Object.defineProperty(e, "__esModule", {value: !0}), e.ChartRegressions = void 0;
            var n = r(642), i = {}, o = 0, a = function () {
                function t() {
                    this.id = "regressions"
                }

                return t.prototype.beforeInit = function (t) {
                    t.$$id = ++o
                }, t.prototype.beforeUpdate = function (t, e) {
                    var r, o, a,
                        c = null === (a = null === (o = null === (r = t.config.options) || void 0 === r ? void 0 : r.plugins) || void 0 === o ? void 0 : o.regressions) || void 0 === a ? void 0 : a.onCompleteCalculation;
                    s(t, (function (e, r, o) {
                        r = new n.MetaDataSet(t, e);
                        var a = 1e3 * t.$$id + o;
                        i[a] = r
                    })), null == c || c(t)
                }, t.prototype.beforeRender = function (t, e) {
                    s(t, (function (t, e) {
                        return e.adjustScales()
                    }))
                }, t.prototype.beforeDatasetsDraw = function (t, e, r) {
                    s(t, (function (t, e) {
                        return e.drawRightBorders()
                    }))
                }, t.prototype.afterDatasetsDraw = function (t, e, r) {
                    s(t, (function (t, e) {
                        return e.drawRegressions()
                    }))
                }, t.prototype.destroy = function (t) {
                    Object.keys(i).filter((function (e) {
                        return e / 1e3 >> 0 == t.$$id
                    })).forEach((function (t) {
                        return delete i[t]
                    }))
                }, t.prototype.getDataset = function (t, e) {
                    var r = 1e3 * t.$$id + e;
                    return i[r]
                }, t.prototype.getSections = function (t, e) {
                    var r = this.getDataset(t, e);
                    return r && r.sections
                }, t
            }();

            function s(t, r) {
                t.data.datasets.forEach((function (n, i) {
                    if (n.regressions && t.isDatasetVisible(i)) {
                        var o = e.ChartRegressions.getDataset(t, i);
                        r(n, o, i)
                    }
                }))
            }

            e.ChartRegressions = new a, window.ChartRegressions = e.ChartRegressions
        }, 491: (t, e) => {
            "use strict";
            Object.defineProperty(e, "__esModule", {value: !0})
        }
    }, e = {};
    !function r(n) {
        var i = e[n];
        if (void 0 !== i) return i.exports;
        var o = e[n] = {exports: {}};
        return t[n].call(o.exports, o, o.exports, r), o.exports
    }(856)
})();
