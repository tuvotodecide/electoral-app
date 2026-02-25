const React = require('react');

const SvgMock = props => React.createElement('SvgMock', props, props.children);

module.exports = SvgMock;
module.exports.default = SvgMock;
