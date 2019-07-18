/*
 * Copyright 2019 John Dimm -- All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 */

class Dimension extends React.Component {

  render() {
     const leftArrow = "\u25C0";
     const rightArrow = "\u25B6";

     //
     // Create a listbox of all values for this dimension.
     //
     var dimValues = this.props.dimValues.map(function(key,i) {
       return (
         <option key={i} name={this.props.name} value={key}>{key}</option>
       )
     }.bind(this));

     //
     // To make a drop-down listbox of values.
     //
     var selectDimValues = '';
     if (this.props.dimValues.length > 0) {
       selectDimValues = (
         <select onChange={function(e) {
           let {name, value} = e.target;
           this.props.addFilter(this.props.name, value);
         }.bind(this)}>{dimValues}</select>
       );
     }

     var prevNext = (<td></td>);

     if (this.props.name == this.props.lastFilter) {
        prevNext = (
           <td className="arrows_div">
           <table className='prev_dim_div'><tbody><tr>
               <td className='prev_dim' onClick={ function() {
                   this.props.slideDim(this.props.name, this.props.selectedValue, -1);
                 }.bind(this)
                }>{leftArrow}</td>

               <td className='next_dim' onClick={ function() {
                   this.props.slideDim(this.props.name, this.props.selectedValue, 1);
                 }.bind(this)
                }>{rightArrow}</td>
           </tr></tbody></table>
           </td>
        );
     }


     var selectedValueDiv = (<div></div>);

     if (this.props.selectedValue != null) {
       selectedValueDiv = (
         <table className='selected_value_table'><tbody><tr>

           {prevNext}

         <td className='selected_value' onClick={ function() {
                this.props.removeFilter(this.props.name)
             }.bind(this)}>
             {this.props.selectedValue}
         </td>

         </tr></tbody></table>
       )
     }


     var titleClass = this.props.isGroupby ? 'dim_groupby' : 'dim_normal';
     var nameSpaced = this.props.name.replace(/_/g, ' ');
     var style = {"display": (this.props.count < 1000) ? "block" : "none"};
     return (
       <div className='dimension' style={style}>
         <div className={titleClass} onClick={this.props.setGroupby}>
            <table className='dim_table'><tbody><tr>
              <td className='dim_name' title={this.props.title}>{nameSpaced}</td>
              <td className='dim_count'>{this.props.count}</td>
            </tr></tbody></table>
          </div>
          {selectedValueDiv}
       </div>
     )
  }
}
