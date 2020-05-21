(function () {
  /**
   * Adds Element BEFORE NeighborElement
   * @param {any} element
   */
  (Element.prototype.appendBefore = function (element) {
    console.log(element.parentNode);
    element.parentNode.insertBefore(this, element);
  }),
    false;
  /**
   * Adds Element AFTER NeighborElement
   * @param {any} element
   */
  (Element.prototype.appendAfter = function (element) {
    element.parentNode.insertBefore(this, element.nextSibling);
  }),
    false;
  /**
   * Finds the parent via selector
   * @param {any} selector
   */
  Element.prototype.parent = function (selector) {
    let parent = this;
    let grandParent = null;
    let children = null;
    let found = false;

    while (!found) {
      parent = parent.parentNode;
      grandParent = parent.parentNode;
      children =
        grandParent && Array.from(grandParent.querySelectorAll(selector));

      if (children.length) {
        children.forEach(function (node) {
          if (parent.isEqualNode(node)) {
            found = true;
            return false;
          }
        });
      }
    }

    return parent;
  };
})();
