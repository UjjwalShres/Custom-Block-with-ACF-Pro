<?php 
	add_action( 'wp_enqueue_scripts', 'blocksy_child_enqueue_styles' );
	function blocksy_child_enqueue_styles() {
 		  wp_enqueue_style( 'parent-style', get_template_directory_uri() . '/style.css' ); 
 		  } 

function render_dynamic_casino_block($attributes) {
    $num_posts = isset($attributes['numPosts']) ? $attributes['numPosts'] : 5;
    $sort_order = isset($attributes['sortOrder']) ? $attributes['sortOrder'] : 'desc';
    $category = isset($attributes['category']) ? $attributes['category'] : '';

    // Query args
    $args = array(
        'post_type'      => 'casino',
        'posts_per_page' => $num_posts,
        'orderby'        => 'date',
        'order'          => $sort_order,
    );

    // If a category from 'casino-category' taxonomy is selected, filter posts by this category
    if ($category) {
        $args['tax_query'] = array(
            array(
                'taxonomy' => 'casino-category',
                'field'    => 'slug',
                'terms'    => $category,
            ),
        );
    }

    $casino_query = new WP_Query($args);

    if ($casino_query->have_posts()) {
        $output = '<div class="casino-posts">';

        while ($casino_query->have_posts()) {
            $casino_query->the_post();

            // Retrieve ACF fields
            $casino_logo = get_field('casino_logo');

            $casino_offer = get_field('casino_offer');
            $casino_USPs = get_field('casino_usps');

            //buttons
            $casino_button_1_text = get_field('casino_button_1_text');
            $casino_button_1_url = get_field('casino_button_1_url');
			$casino_button_2_text = get_field('casino_button_2_text');
            $casino_button_2_url = get_field('casino_button_2_url');

            $output .= '<div class="casino-post">';

            // Display the image
            if ($casino_logo) {
				$output .= '<div class="casino-logo-wrapper">';
                $output .= '<img src="' . esc_url($casino_logo['url']) . '" alt="' . esc_attr($casino_logo['alt']) . '">';
				$output .= '</div>';
            }

            // Display the casino text
            $output .= '<p class="casino-offer-text">' . esc_html($casino_offer) . '</p>';

            $output .= '<div class="casino-usps-text">' . $casino_USPs . '</div>';


			$output .= '<div class="casino-post-button-wrapper">';
            // Display the button 1 URL and text
            if ($casino_button_1_url) {
                $output .= '<a href="' . esc_url($casino_button_1_url) . '" target="_blank" class="casino-button-1">'. esc_html($casino_button_1_text). '</a>';
            }

			// Display the button 2 URL and text
            if ($casino_button_2_url) {
                $output .= '<a href="' . esc_url($casino_button_2_url) . '" target="_blank" class="casino-button-2">'. esc_html($casino_button_2_text). '</a>';
            }
			$output .= '</div>'; 
			// button wrapper ends here

            $output .= '</div>';
        }

        $output .= '</div>';
        wp_reset_postdata();
    } else {
        $output = '<p>No casino posts found.</p>';
    }

    return $output;
}

function register_dynamic_casino_block() {
    register_block_type('casino/dynamic-block', array(
        'render_callback' => 'render_dynamic_casino_block',
        'attributes'      => array(
            'numPosts' => array('type' => 'number', 'default' => 5),
            'sortOrder' => array('type' => 'string', 'default' => 'desc'),
            'category' => array('type' => 'string', 'default' => ''),
        ),
    ));
}
add_action('init', 'register_dynamic_casino_block');

// ------------------------------Single Casino Block---------------------

function render_single_casino_block($attributes) {
    $specific_post = isset($attributes['specificPost']) ? $attributes['specificPost'] : null;

    // Check if the specific post ID is set
    if (!$specific_post) {
        return '<p>No casino post selected. because !specific_post</p>'; // This is returned as valid HTML
    }

    // WP Query for the specific post
    $args = array(
        'p' => $specific_post,
        'post_type' => 'casino',
    );
    $casino_single_query = new WP_Query($args);

    // Prepare output
    $output = '';
    if ($casino_single_query->have_posts()) {
        $output .= '<div class="casino-posts">';
        while ($casino_single_query->have_posts()) {
            $casino_single_query->the_post();

            // Retrieve ACF fields and other content
            $casino_single_logo = get_field('casino_logo');
            $casino_single_offer = get_field('casino_offer');
            $casino_single_USPs = get_field('casino_usps');

            // Buttons
            $casino_single_button_1_text = get_field('casino_button_1_text');
            $casino_single_button_1_url = get_field('casino_button_1_url');
            $casino_single_button_2_text = get_field('casino_button_2_text');
            $casino_single_button_2_url = get_field('casino_button_2_url');

            $output .= '<div class="casino-post">';

            // Display logo
            if ($casino_single_logo) {
                $output .= '<div class="casino-logo-wrapper">';
                $output .= '<img src="' . esc_url($casino_single_logo['url']) . '" alt="' . esc_attr($casino_single_logo['alt']) . '">';
                $output .= '</div>';
            }

            // Display offer text
            $output .= '<p class="casino-offer-text">' . esc_html($casino_single_offer) . '</p>';

            // Display USPs
            $output .= '<div class="casino-usps-text">' . $casino_single_USPs . '</div>';

            $output .= '<div class="casino-post-button-wrapper">';
            // Buttons
            if ($casino_single_button_1_url) {
                $output .= '<a href="' . esc_url($casino_single_button_1_url) . '" target="_blank" class="casino-button-1">' . esc_html($casino_single_button_1_text) . '</a>';
            }
            if ($casino_single_button_2_url) {
                $output .= '<a href="' . esc_url($casino_single_button_2_url) . '" target="_blank" class="casino-button-2">' . esc_html($casino_single_button_2_text) . '</a>';
            }
            $output .= '</div>';
            
            $output .= '</div>'; // End of casino post
        }
        $output .= '</div>';
        wp_reset_postdata(); // Always reset post data after WP_Query
    } else {
        $output = '<p>No casino post found.</p>';
    }

    return $output;
}

function register_single_casino_block() {
    register_block_type('casino/single-casino-search-block', array(
        'render_callback' => 'render_single_casino_block',
    ));
}
add_action('init', 'register_single_casino_block');


//-----------------enqueue-----------------------

function enqueue_casino_block_frontend_assets() {
    // Enqueue the frontend style for both blocks
    wp_enqueue_style(
        'casino-block-style',
        get_stylesheet_directory_uri() . '/css/casino-block.css',
        array(),
        filemtime(get_stylesheet_directory() . '/css/casino-block.css')
    );
}
add_action('wp_enqueue_scripts', 'enqueue_casino_block_frontend_assets');

function enqueue_casino_block_editor_assets() {
    // Enqueue the block editor script for the sorting block
    wp_enqueue_script(
        'casino-block-editor',
        get_stylesheet_directory_uri() . '/js/casino-block.js',
        array('wp-blocks', 'wp-element', 'wp-editor'),
        filemtime(get_stylesheet_directory() . '/js/casino-block.js'),
        true
    );
}
add_action('enqueue_block_editor_assets', 'enqueue_casino_block_editor_assets');

function enqueue_block_editor_styles() {
    wp_enqueue_style(
        'block-editor-styles',
        get_stylesheet_directory_uri() . '/css/block-editor-styles.css',
        array(),
        filemtime(get_stylesheet_directory() . '/css/block-editor-styles.css')
    );
}
add_action('enqueue_block_editor_assets', 'enqueue_block_editor_styles');



?>