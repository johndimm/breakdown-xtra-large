/*
 * Copyright 2019 John Dimm -- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 */
class Dimension extends React.Component {
  render() {
    const leftArrow = "\u25C0";
    const rightArrow = "\u25B6"; //
    // Create a listbox of all values for this dimension.
    //

    var dimValues = this.props.dimValues.map(function (key, i) {
      return React.createElement("option", {
        key: i,
        name: this.props.name,
        value: key
      }, key);
    }.bind(this)); //
    // To make a drop-down listbox of values.
    //

    var selectDimValues = '';

    if (this.props.dimValues.length > 0) {
      selectDimValues = React.createElement("select", {
        onChange: function (e) {
          let {
            name,
            value
          } = e.target;
          this.props.addFilter(this.props.name, value);
        }.bind(this)
      }, dimValues);
    }

    var prevNext = React.createElement("td", null);

    if (this.props.name == this.props.lastFilter) {
      prevNext = React.createElement("td", {
        className: "arrows_div"
      }, React.createElement("table", {
        className: "prev_dim_div"
      }, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", null, React.createElement("div", {
        className: "arrow prev_dim",
        onClick: function () {
          this.props.slideDim(this.props.name, this.props.selectedValue, -1);
        }.bind(this)
      }, leftArrow)), React.createElement("td", null, React.createElement("div", {
        className: "arrow next_dim",
        onClick: function () {
          this.props.slideDim(this.props.name, this.props.selectedValue, 1);
        }.bind(this)
      }, rightArrow))))));
    }

    var selectedValueDiv = React.createElement("div", null);

    if (this.props.selectedValue != null) {
      selectedValueDiv = React.createElement("table", {
        className: "selected_value_table"
      }, React.createElement("tbody", null, React.createElement("tr", null, prevNext, React.createElement("td", {
        className: "selected_value",
        onClick: function () {
          this.props.removeFilter(this.props.name);
        }.bind(this)
      }, this.props.selectedValue))));
    }

    var titleClass = 'dim_normal';
    if (this.props.count > 1000) titleClass = 'dim_toobig';else if (this.props.isGroupby) titleClass = 'dim_groupby';
    var nameSpaced = this.props.name.replace(/_/g, ' ');
    return React.createElement("div", {
      className: "dimension"
    }, React.createElement("div", {
      className: titleClass,
      onClick: this.props.setGroupby
    }, React.createElement("table", {
      className: "dim_table"
    }, React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
      className: "dim_name",
      title: this.props.title
    }, nameSpaced), React.createElement("td", {
      className: "dim_count"
    }, this.props.count))))), selectedValueDiv);
  }

}