'use strict';

var columnSizing = 'ko-grid-column-sizing';

define(['module', 'knockout', 'onefold-dom', 'ko-grid', columnSizing], function (module, ko, dom, koGrid) {
    var extensionId = module.id.indexOf('/') < 0 ? module.id : module.id.substring(0, module.id.indexOf('/'));

    var MINIMAL_COLUMN_WIDTH = 10;

    var document = window.document,
        requestAnimationFrame = window.requestAnimationFrame.bind(window),
        cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

    koGrid.defineExtension(extensionId, {
        dependencies: [columnSizing],
        Constructor: function ColumnResizingExtension(bindingValue, config, grid) {

            var isResizable = grid.extensions[columnSizing].isResizable;

            var perHeaderSubscriptions = {};
            var insertResizers = function (headers) {
                headers.forEach(function (header) {
                    if (!perHeaderSubscriptions[header.id] && header.columns.filter(isResizable).length) {
                        perHeaderSubscriptions[header.id] = header.element.subscribe(function (element) {
                            if (element) {
                                var resizer = document.createElement('div');
                                resizer.classList.add('ko-grid-column-resizer');
                                element.appendChild(resizer);
                            }
                        });
                    }
                });
            };
            var headersSubscription = grid.headers.all.subscribe(insertResizers);
            insertResizers(grid.headers.all());

            var resizeInProgress = false;
            this.isResizeInProgress = () => resizeInProgress;
            this['isResizeInProgress'] = this.isResizeInProgress;

            grid.rootElement.addEventListener('mousedown', e => {
                if (!dom.element.matches(e.target, '.ko-grid-column-resizer'))
                    return;

                e.preventDefault();

                var overlay = document.createElement('div');
                overlay.id = 'ko-grid-column-resize-in-progress';
                document.body.appendChild(overlay);
                e.target.classList.add('active');
                resizeInProgress = true;

                var header = ko.contextFor(e.target)['header']();
                var columns = header.columns.filter(isResizable);
                var initialCombinedWidth = 0;
                var columnWidthFactors = [];
                for (var i = columns.length - 1; i >= 0; --i) {
                    var columnWidth = columns[i].widthInPixels();
                    initialCombinedWidth += columnWidth;
                    columnWidthFactors.unshift(columnWidth / initialCombinedWidth);
                }

                var initialMousePosition = e.pageX;
                var newMousePosition = initialMousePosition;
                var animationFrameRequest = null;

                function adjustWidths() {
                    var newCombinedWidth = initialCombinedWidth + newMousePosition - initialMousePosition;
                    newCombinedWidth = Math.max(0, newCombinedWidth - columns.length * MINIMAL_COLUMN_WIDTH);

                    for (var i = 0; i < columns.length; ++i) {
                        var share = Math.round(columnWidthFactors[i] * newCombinedWidth);
                        columns[i].width((MINIMAL_COLUMN_WIDTH + share) + 'px');
                        newCombinedWidth -= share;
                    }
                }

                function onMouseMove(e2) {
                    newMousePosition = e2.pageX;
                    if (animationFrameRequest)
                        cancelAnimationFrame(animationFrameRequest);
                    animationFrameRequest = requestAnimationFrame(adjustWidths);
                    e.preventDefault();
                }

                function onMouseUp() {
                    if (animationFrameRequest)
                        cancelAnimationFrame(animationFrameRequest);
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    document.body.removeChild(overlay);
                    e.target.classList.remove('active');
                    resizeInProgress = false;

                    grid.layout.recalculate();
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }, true);
            grid.rootElement.addEventListener('click', e => {
                if (dom.element.matches(e.target, '.ko-grid-column-resizer'))
                    e.preventDefault();
            }, true);

            this.dispose = () => {
                headersSubscription.dispose();
                Object.keys(perHeaderSubscriptions).forEach(function (k) {
                    perHeaderSubscriptions[k].dispose();
                });
            };
        }
    });

    return koGrid.declareExtensionAlias('columnResizing', extensionId);
});
