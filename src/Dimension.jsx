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

     var prevNext = (<div></div>);
     if (this.props.name == this.props.lastFilter) {
        prevNext = (

           <div className='prev_dim_div'>
               <div className='prev_dim' onClick={ function() {
                   this.props.slideDim(this.props.name, this.props.selectedValue, -1);
                 }.bind(this)
                }>{leftArrow}</div>

               <div className='next_dim' onClick={ function() {
                   this.props.slideDim(this.props.name, this.props.selectedValue, 1);
                 }.bind(this)
                }>{rightArrow}</div>
           </div>
        );
     }

     var selectedValueDiv = (<div></div>);
     if (this.props.selectedValue != null) {
       selectedValueDiv = (
         <div className="selected_value_div">

         {prevNext}

           <div className='selected_value' onClick={ function() {
                 this.props.removeFilter(this.props.name)
              }.bind(this)
           }>{this.props.selectedValue}</div>

         </div>
       );
     }

     var titleClass = this.props.isGroupby ? 'dim_groupby' : 'dim_normal';
     return (
       <div className='dimension'>
         <div className={titleClass} onClick={this.props.setGroupby}>
            <div className='dim_name'>{this.props.name}</div>
            <div className='dim_count'>{this.props.count}</div>
          </div>
          {selectedValueDiv}
       </div>
     )
  }
}
