/**
 *
 * Copyright 2015, Institute for Systems Biology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/**
 * Created by rossbohner on 12/9/15.
 */
require.config({
    baseUrl: '/static/js/',
    paths: {
        jquery: 'libs/jquery-1.11.1.min',
        bootstrap: 'libs/bootstrap.min',
        jqueryui: 'libs/jquery-ui.min',
        session_security: 'session_security',
        underscore: 'libs/underscore-min',
        assetscore: 'libs/assets.core',
        assetsresponsive: 'libs/assets.responsive',
        d3: 'libs/d3.min',
        d3tip: 'libs/d3-tip',
        science: 'libs/science.min',
        stats: 'libs/science.stats.min',
        vizhelpers: 'helpers/vis_helpers',
        select2: 'libs/select2.min',
        base: 'base',
        plot_factory : 'visualizations/plotFactory',
        histogram_plot : 'visualizations/createHistogram',
        scatter_plot : 'visualizations/createScatterPlot',
        cubby_plot : 'visualizations/createCubbyPlot',
        violin_plot : 'visualizations/createViolinPlot',
        bar_plot : 'visualizations/createBarGraph'
    },
    shim: {
        'bootstrap': ['jquery'],
        'jqueryui': ['jquery'],
        'session_security': ['jquery'],
        'assetscore': ['jquery', 'bootstrap', 'jqueryui'],
        'assetsresponsive': ['jquery', 'bootstrap', 'jqueryui'],
        'select2': ['jquery'],
        'plot_factory':['vizhelpers', 'session_security'],
        'stats':['science'],
        'histogram_plot' : ['science','stats']
    }
});

require([
    'jquery',
    'plot_factory',
    'vizhelpers',
    'session_security',
    'jqueryui',
    'bootstrap',
    'd3',
    'd3tip',
    'select2',
    'assetscore',
    'assetsresponsive',
    'base'
], function ($, plot_factory, vizhelpers) {
    // Resets forms in modals on cancel. Suppressed warning when leaving page with dirty forms
    $('.modal').on('hide.bs.modal', function() {
        var forms = $(this).find('form');
        if(forms.length)
            _.each(forms, function (form) {
                form.reset();
            });
    });

    $('#clin-accordion').on('show.bs.collapse', function (e) {
        $(e.target).siblings('a').find('i.fa-caret-down').show();
        $(e.target).siblings('a').find('i.fa-caret-right').hide();
    });

    $('#clin-accordion').on('hide.bs.collapse', function (e) {
        $(e.target).siblings('a').find('i.fa-caret-right').show();
        $(e.target).siblings('a').find('i.fa-caret-down').hide()
    });

    $('.show-more').on('click', function() {
        $(this).siblings('li.extra-values').show();
        $(this).siblings('.show-less').show();
        $(this).hide();
    });

    $('.show-less').on('click', function() {
        $(this).siblings('li.extra-values').hide();
        $(this).siblings('.show-more').show();
        $(this).hide();
    });

    // comments interactions
    $('.show-flyout').on('click', function() {
        var target = $(this).closest('.worksheet').find('.comment-flyout');
        $(target).animate({
            right: '-1px'
        }, 800).toggleClass('open');
    });
    $('.hide-flyout').on('click', function() {
        $(this).parents('.fly-out').animate({
            right: '-400px'
        }, 800, function(){
            $(this).removeClass('open');
        })
    });

    // settings flyout interactions
    function show_plot_settings() {
        var target = $(document).find('.settings-flyout');
        $(target).animate({
            right: '-1px'
        }, 800).toggleClass('open');
    }

    $('.show-settings-flyout').on('click', function() {
        show_plot_settings();
    });

    function hide_plot_settings(){
        $('.hide-settings-flyout').parents('.fly-out.settings-flyout').animate({
            right: '-400px'
        }, 800, function(){
            $(this).removeClass('open');
        })
    }
    $('.hide-settings-flyout').on('click', function() {
        hide_plot_settings();
    });

    //What is this for?
    $('.dropdown-menu').find("[data-toggle='modal']").click(function(){
        //$(this.getAttribute("data-target")).modal();
    })

    ////Model communications
    $('.add_worksheet_comment_form').on('submit', function(event) {
        event.preventDefault();
        var form        = this;
        var workbookId  = $(form).find("#workbook_id_input").val();
        var worksheetId = $(form).find("#worksheet_id_input").val();
        var url         = base_url + '/workbooks/' + workbookId + '/worksheets/' + worksheetId + '/comments/create';

        $.ajax({
            type : 'POST',
            url  : url,
            data : $(this).serialize(),
            success: function(data) {
                data = JSON.parse(data);
                $('.comment-flyout .flyout-body').append('<h5 class="comment-username">' + data['first_name'] + ' ' + data['last_name'] + '</h5>');
                $('.comment-flyout .flyout-body').append('<p class="comment-content">' + data['content'] + '</p>')
                $('.comment-flyout .flyout-body').append('<p class="comment-date">' + data['date_created'] + '</p>');

                form.reset();
            },
            error: function() {
                console.log('Failed to save comment.');
                $('.comment-flyout .flyout-body').append('<p class="comment-content error">Fail to save comment. Please try back later.</p>')
                form.reset()
            }
        });

        return false;
    });

    $('.worksheet-nav-toggle').on('click', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('open');
        $(this).toggleClass('open');
        $(this).parent().prev('.worksheet-nav').toggleClass('closed');
    })

    // tabs interaction on dropdown selected
    var tabsList = $('#worksheets-tabs a[data-toggle="tab"]');

    tabsList.on('shown.bs.tab', function(e){
        var targetTab = $(this).parent();
        var targetWorksheetNumber = $(this).attr('href');

        if($(this).closest('#more-tabs').length > 0){
            openTabsfromDropdown(targetTab);
        }
        e.preventDefault();
    })

    function openTabsfromDropdown(target){
        var lastTabNum = 3;
        var lastTab = $(tabsList[lastTabNum-1]).parent();
        var moreTabs = $('#more-tabs');
        var dropdown = $('#worksheets-dropdown-menu');

        moreTabs.before(target);
        moreTabs.removeClass('active');
        lastTab.removeClass('active');
        dropdown.prepend(lastTab);
        tabsList = $('#worksheets-tabs a[data-toggle="tab"]');
    }

    // Activate the recent added tab
    if(display_worksheet_id){
        var recentWorksheetTab = $("a[href='#"+ display_worksheet_id +"']");
        var recentWorksheetTarget = recentWorksheetTab.parent();
        //$(tabsList[0]).parent().removeClass('active');
        if(recentWorksheetTarget.closest('#more-tabs').length > 0){
            openTabsfromDropdown(recentWorksheetTarget);
        }
    }

    /*
     * Event handler for the Swap button
     */
    $('.swap').click(function(){
        function get_values(selection){
            var result;
            if(selection.attr("type") != "gene"){
                result = {variable : selection.val(), type : "common"};
            } else {
                result = {variable : selection.val(), type : "gene"};
                var parent = selection.parents(".variable-container");
                var spec   = parent.find('.spec-select').find(":selected").val();
                var options = parent.find('.attr-options :visible');
                var selection = options.find('#search-term-select').find(":selected").val();
                //get all the gene selections for this variable
                options.find('.field-options').each(function(i, ele){
                    result[ele.id] = ele.value;
                });
                result['specification'] = spec;
                result['selection']     = selection;
            }
            return result;
        }

        function apply_values(variable_element, data){
            if(data.type == "common"){
                variable_element.val(data.variable);
                axis_select_change(variable_element);
            } else {
                variable_element.val(data.variable);
                var parent = variable_element.parents(".variable-container");
                parent.find('.spec-select').val(data.specification);
                axis_attribute_change(parent.find('.spec-select'));
                var keys = Object.keys(data)
                parent.find('.'+ data.specification).find('.field-options').each(function(i, ele){
                    if($.inArray(ele.id, keys)){
                        ele.value = data[ele.id];
                    }
                });
                parent.find('#search-term-select').val(data.selection);
            }
        }

        var x = get_values($(this).parent().find('#x-axis-select').find(":selected"));
        var y = get_values($(this).parent().find('#y-axis-select').find(":selected"));

        apply_values($(this).parent().find('#x-axis-select'), y);
        apply_values($(this).parent().find('#y-axis-select'), x);
    });

    /*
     * Event Handlers for X-Axis
     */
    function axis_attribute_change(self){
        if($(self).attr('id') == 'x-gene-attribute-select'){
            x_attribute_change(self);
        } else if($(self).attr('id') == 'y-gene-attribute-select'){
            y_attribute_change(self);
        }
    }
    function axis_select_change(self){
        if($(self).attr('id') == 'x-axis-select'){
            x_select_change(self);
        } else if($(self).attr('id') == 'y-axis-select'){
            y_select_change(self);
        }
    }
    function x_select_change(self){
        var type = $(self).find(":selected").attr('type');
        $(self).parent().find(".attr-options").fadeOut();
        if(type == "gene"){
            $(self).parent().find("#x-gene-attribute-select").fadeIn();
            var gene = $(self).find(":selected").val();
        } else {
            $(self).parent().find("#x-gene-attribute-select").fadeOut();
            $(self).parent().find("#x-axis-data-type-container").fadeOut();
        }
    }
    $('#x-axis-select').change(function(){
        x_select_change(this);
    });
    function x_attribute_change(self){
        $(self).parent().find(".attr-options").fadeOut();
        var attr = $(self).find(":selected").val();
        $(self).parent().find("."+attr).fadeIn();
    }
    $("#x-gene-attribute-select").change(function(){
        x_attribute_change(this);
    });

    /*
     * Color_by handler, update based on x and y selection
     */
    $(".search-term-field").change(function(){
        var parent    = $(this).parents(".variable-container");
        var selection = $(this).find(":selected");
        var variable  = parent.attr('variable');
        parent.parent().find("#color_by").find('[axis="'+variable+'"]').remove();
        parent.parent().find("#color_by").append('<option axis="'+variable+'" value="'+selection.val()+'">'+selection.text()+'</option>');
    });

    /*
     * Event Handlers for Y-Axis
     */
    function y_select_change(self) {
        console.log("y_select_changed");
        $(self).parent().find(".attr-options").fadeOut();
        var type = $(self).find(":selected").attr('type');
        if(type == "gene"){
            $(self).parent().find("#y-gene-attribute-select").fadeIn();
            var gene = $(self).find(":selected").val();
        } else {
            $(self).parent().find("#y-gene-attribute-select").fadeOut();
            $(self).parent().find("#y-axis-data-type-container").fadeOut();
        }
    }
    $('#y-axis-select').change(function(){
        y_select_change(this);
    });
    function y_attribute_change(self){
        console.log("y_attribute_changed");
        $(self).parent().find(".attr-options").fadeOut();
        var attr = $(self).find(":selected").val();
        $(self).parent().find("."+attr).fadeIn();
    }
    $("#y-gene-attribute-select").change(function(){
        y_attribute_change(this);
    });

    /*
     * Gene attribute selection
     */
    $('.datatype-selector').on('click',  function() { console.log("data-type selector"); vizhelpers.get_datatype_search_interfaces(this, this.getAttribute("data-field"));});
    $('.feature-search').on('change',    function() { console.log("feature search");  vizhelpers.field_search_change_callback(this); });
    $('.select-field').on('click',       function() { console.log("select-field"); vizhelpers.select_field_callback(this); });
    $('.close-field-search').on('click', function() { console.log("close-field-search");vizhelpers.close_field_search_callback(this); });
    $('.field-options').on('change', function(event) {
        var self            = $(this);
        var parent          = self.parent();
        var datatype        = parent[0].getAttribute('data-field');
        var filterElements  = parent.find('select');
        var variable_name   = self.parents(".variable-container").attr('variable');
        var gene_selection  = self.parents(".variable-container").find('#' + variable_name).find(":selected").val();
        var filters         = [{ filter : 'gene_name',
                                 value  : gene_selection}];
        $.each(filterElements, function(i, ele){
            var value = $(ele).find(":selected").text();
            if(value !== "" && value !== "Please select an option" ){
                filters.push({'filter' : ele.getAttribute('data-field'), 'value' : value});
            }
        });

        vizhelpers.get_variable_field_options(datatype, filters, function(options){
            var selectbox = parent.parent('.search-field').find('.feature-search .search-term-field');
            selectbox.empty();
            selectbox.append('<option value="" disabled selected>Please select an option</option>');
            for (var i = 0; i < options.length; i++) {
                selectbox.append('<option value="'+options[i]['internal_feature_id']+'">'+options[i]['label']+'</option>')
            }
        });
    })

    //generate plot based on user change
    $('.update-plot').on('click', function(event){
        if(valid_plot_settings($(this).parent())) {
            //var data = get_plot_info_on_page($(this).parent());
            //update_plot_model(workbook_id, data.worksheet_id, data.plot_id, data.attrs, function(result){
            //    generate_plot(data.worksheet_id, data.attrs.type, data.attrs.x_axis.url_code, data.attrs.y_axis.url_code, data.attrs.color_by.url_code, data.attrs.cohorts);
            //    hide_plot_settings();
            //});
        }
    });

    function get_plot_info_on_page(worksheet){
        var parent       = $(worksheet).find('.update-plot').parent();

        function variable_values(label){
            var result;
            if(parent.find('#'+label).find(":selected").attr("type") == "gene"){
                result = {  id : parent.find('#'+label).find(":selected").attr('var_id'),
                            url_code : parent.find('[variable="'+ label + '"]').find("#search-term-select").find(":selected").val()};
            } else {
                result = {  id: parent.find('#'+label).find(":selected").attr('var_id'),
                            url_code: parent.find('#'+label).find(":selected").val()}
            }
            return result;
        }

        var result = {
            worksheet_id : $(worksheet).find('.update-plot').attr("worksheet_id"),
            plot_id      : $(worksheet).find('.update-plot').attr("plot_id"),
            attrs        : {
                type: parent.parentsUntil(".worksheet-body").find(".plot_selection").find(":selected").text(),
                x_axis: variable_values('x-axis-select'),
                y_axis: variable_values('y-axis-select'),
                color_by: {
                    id: parent.find('#color_by').find(":selected").attr('var_id'),
                    url_code: parent.find('#color_by').find(":selected").val()
                },
                cohorts: parent.find('[name="cohort-checkbox"]:checked').map(function () {
                    return {id: this.value, cohort_id: $(this).attr("cohort-id")};
                }).get()
            }
        }

        //{
        //    id: parent.find('#y-axis-select').find(":selected").attr('var_id'),
        //    url_code: parent.find('#y-axis-select').find(":selected").val()
        //},
        return result;
    }

    function get_plot_info(selector, callback){
        var worksheet_id = $(selector).attr("worksheet_id");
        var plot_type = $(selector).find(":selected").text();
        if(plot_type != "-- select an analysis --") {
            get_plot_model(workbook_id, worksheet_id, plot_type, function (data) {
                if (data.error) {
                    console.log("Display error");
                    callback(false);
                } else {
                    load_plot(worksheet_id, data, function (success) {
                        callback(true);
                    });
                }
            });
        } else {
            callback(false);
        }
    }
    //get plot model when selection changes
    $(".plot_selection").on("change", function(event){
        $(this).find(":disabled :selected").remove()
        get_plot_info(this, function(success){
            show_plot_settings();
        })
    });

    ////initialize all plots at the beginning
    $(".plot_selection").each(function(){
        var self = this;
        get_plot_info(this, function(success){
            if(success) {
                if (valid_plot_settings($(self).parentsUntil(".worksheet-body").find('.update-plot').parent())) {
                    var data = get_plot_info_on_page($(self).parentsUntil(".worksheet-body").find('.update-plot').parent());
                    generate_plot(data.worksheet_id, data.attrs.type, data.attrs.x_axis.url_code, data.attrs.y_axis.url_code, data.attrs.color_by.url_code, data.attrs.cohorts)
                }
            }
        });
    });

    //validate the plot settings before initiating the plot
    function valid_plot_settings(worksheet){
        var data = get_plot_info_on_page(worksheet);
        var is_valid=false;
        if(data.attrs.x_axis.id !== 'undefined' &&
            data.attrs.y_axis.id !== 'undefined' &&
            data.attrs.color_by.id !== 'undefined' &&
            data.attrs.cohorts.length >0){
                is_valid = true;
        }
        return is_valid;
    }

    //generates the actual svg plots by accepting the plot settings configured in the settings area
    function generate_plot(worksheet_id, type, x_var_code, y_var_code, color_by, cohorts){
        var cohort_ids = [];
        //create list of actual cohort models
        for(var i in cohorts){
            cohort_ids.push(cohorts[i].cohort_id);
        }
        var plotFactory = Object.create(plot_factory, {});

        var plot_element = $("[worksheet_id='"+worksheet_id+"']").parent().parent().find(".plot");
        var plot_loader  = plot_element.find('.plot-loader');
        var plot_area    = plot_element.find('.plot-div');
        var plot_legend  = plot_element.find('.legend');
        var pair_wise    = plot_element.find('.pairwise-result');
        pair_wise.empty();
        plot_area.empty();
        plot_legend.empty();
        var plot_selector   = '#' + plot_element.prop('id') + ' .plot-div';
        var legend_selector = '#' + plot_element.prop('id') + ' .legend';

        plot_loader.fadeIn();
        plotFactory.generate_plot(plot_selector, legend_selector, pair_wise, type, x_var_code, y_var_code, color_by, cohort_ids, false, function(){
            plot_loader.fadeOut();
        });
    }

    //loads the plot data into the ui inputs for adjustment
    function load_plot(worksheet_id, plot_data, callback){
        var plot_element = $("[worksheet_id='"+worksheet_id+"']").parent().parent().find(".plot");

        plot_element.find('.update-plot').attr('plot_id', plot_data.id).change();
        plot_element.find('#cohort-plot-id').val(plot_data.id);

        if(plot_data.x_axis) {
            plot_element.find('#x-axis-select').val(plot_data.x_axis.url_code);
        }
        if(plot_data.y_axis) {
            plot_element.find('#y-axis-select').val(plot_data.y_axis.url_code);
        }
        if(plot_data.color_by) {
            plot_element.find('#color_by').val(plot_data.color_by.url_code);
        }
        if(plot_data.cohort) {
            for(var i in plot_data.cohort){
                plot_element.find('[name="cohort-checkbox"]').each(function(){
                    //comparing worksheet_cohorts model ids
                    if(plot_data.cohort[i].cohort.id == parseInt(this.value)){
                        $(this).prop("checked", true);
                    }
                });
            }
        }
        callback(true);
    }

    //the server side call made here will also change the active entry for the worksheet
    function get_plot_model(workbook_id, worksheet_id, type, callback){
        var csrftoken = get_cookie('csrftoken');
        $.ajax({
            type        : 'GET',
            url         : base_url + '/workbooks/' + workbook_id + '/worksheets/' + worksheet_id + "/plots/",
            data        : {type : type},
            dataType    :'json',
            beforeSend  : function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
            success : function (result) {
                if(result.error){
                    callback({error: result.error});
                }
                if(result.data){
                    callback(result.data);
                }
            },
            error: function (result) {
                callback({error: result.error});
            }
        });
    }

    function update_plot_model(workbook_id, worksheet_id, plot_id, attrs, callback){
        var csrftoken = get_cookie('csrftoken');
        $.ajax({
            type        :'POST',
            dataType    :'json',
            url         : base_url + '/workbooks/' + workbook_id + '/worksheets/' + worksheet_id + "/plots/" + plot_id + "/edit",
            data        : JSON.stringify({attrs : attrs}),
            beforeSend  : function(xhr){xhr.setRequestHeader("X-CSRFToken", csrftoken);},
            success : function (data) {
                callback(data);
            },
            error: function () {
                console.log('Failed to add variable list to workbook');
            }
        });
    }

    // Ajax submitting forms
    $('.ajax-form-modal').find('form').on('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $this = $(this),
            fields = $this.serialize();

        $this.find('.btn').addClass('btn-disabled').attr('disabled', true);
        $.ajax({
            url: $this.attr('action'),
            data: fields,
            method: 'POST'
        }).then(function () {
            $this.closest('.modal').modal('hide');
            if($this.data('redirect')) {
                window.location = $this.data('redirect');
            } else {
                window.location.reload();
            }
        }, function () {
            $this.find('.error-messages').append(
                $('<p>')
                    .addClass('alert alert-danger')
                    .text('There was an error deleting that study. Please reload and try again, or try again later.')
            );
        })
        .always(function () {
            $this.find('.btn').removeClass('btn-disabled').attr('disabled', false);
        });
    });

    /*
        Saving cohorts from plot,
     */
    $('form[action="/cohorts/save_cohort_from_plot/"]').on('submit', function(event) {
        event.preventDefault();
        var form = this;
        $.ajax({
            type: 'POST',
            url: base_url + '/cohorts/save_cohort_from_plot/',
            dataType  :'json',
            data: $(this).serialize(),
            success: function(data) {
                console.log(data)
                if(data.error){
                    $('#js-messages').append(
                        $('<p>')
                            .addClass('alert alert-danger alert-dismissible')
                            .text(data.error));
                } else {
                     $('#js-messages').append(
                        $('<p>')
                            .addClass('alert alert-info alert-dismissible')
                            .text(data.message));
                }
                $('.toggle-selection').click();
                $('.modal').modal('hide');
                form.reset();
                $("html, body").animate({
                    scrollTop: 0
                }, 600);
            },
            error: function(data) {
                form.reset();
            }
        });
        return false;
    });

    /*
        Used for getting the CORS token for submitting data
     */
    function get_cookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});

