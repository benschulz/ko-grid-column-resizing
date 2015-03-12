/**
 * @license Copyright (c) 2015, Ben Schulz
 * License: BSD 3-clause (http://opensource.org/licenses/BSD-3-Clause)
 */
;(function(factory) {
    if (typeof define === 'function' && define['amd'])
        define(['ko-grid', 'knockout', 'ko-grid-column-sizing', 'ko-data-source', 'ko-indexed-repeat'], factory);
    else
        window['ko-grid-column-resizing'] = factory(window.ko.bindingHandlers['grid'], window.ko);
} (function(ko_grid, knockout) {
/*
 * Copyright (c) 2015, Ben Schulz
 * License: BSD 3-clause (http://opensource.org/licenses/BSD-3-Clause)
 */
var onefold_dom, ko_grid_column_resizing_column_resizing, ko_grid_column_resizing;
onefold_dom = function () {
  var onefold_dom_internal, onefold_dom;
  onefold_dom_internal = function () {
    function strictlyContains(container, node) {
      return !!(container.compareDocumentPosition(node) & 16);
    }
    function determineDepth(root, node) {
      var depth = 0;
      while (node) {
        if (node === root)
          return depth;
        node = node.parentNode;
        ++depth;
      }
      throw new Error('The given node is not part of the subtree.');
    }
    var Element = window.Element;
    var matches = Element.prototype.webkitMatchesSelector || Element.prototype.mozMatchesSelector || Element.prototype.msMatchesSelector || Element.prototype.matches;
    function closest(element, selector) {
      do {
        if (matches.call(element, selector))
          return element;
        element = element.parentElement;
      } while (element);
      return null;
    }
    return {
      determineDepth: determineDepth,
      isOrContains: function (container, node) {
        return container === node || strictlyContains(container, node);
      },
      strictlyContains: strictlyContains,
      element: {
        closest: closest,
        matches: function (element, selector) {
          return matches.call(element, selector);
        }
      }
    };
  }();
  onefold_dom = function (main) {
    return main;
  }(onefold_dom_internal);
  return onefold_dom;
}();

var columnSizing = 'ko-grid-column-sizing';
ko_grid_column_resizing_column_resizing = function (module, ko, dom, koGrid) {
  var extensionId = 'ko-grid-column-resizing'.indexOf('/') < 0 ? 'ko-grid-column-resizing' : 'ko-grid-column-resizing'.substring(0, 'ko-grid-column-resizing'.indexOf('/'));
  var MINIMAL_COLUMN_WIDTH = 10;
  var document = window.document, requestAnimationFrame = window.requestAnimationFrame.bind(window), cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
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
      this.isResizeInProgress = function () {
        return resizeInProgress;
      };
      this['isResizeInProgress'] = this.isResizeInProgress;
      grid.rootElement.addEventListener('mousedown', function (e) {
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
            columns[i].width(MINIMAL_COLUMN_WIDTH + share + 'px');
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
      grid.rootElement.addEventListener('click', function (e) {
        if (dom.element.matches(e.target, '.ko-grid-column-resizer'))
          e.preventDefault();
      }, true);
      this.dispose = function () {
        headersSubscription.dispose();
        Object.keys(perHeaderSubscriptions).forEach(function (k) {
          perHeaderSubscriptions[k].dispose();
        });
      };
    }
  });
  return koGrid.declareExtensionAlias('columnResizing', extensionId);
}({}, knockout, onefold_dom, ko_grid);
ko_grid_column_resizing = function (main) {
  return main;
}(ko_grid_column_resizing_column_resizing);return ko_grid_column_resizing;
}));