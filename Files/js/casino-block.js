const { registerBlockType } = wp.blocks;
const { createElement, useState, useEffect } = wp.element;
const { InspectorControls } = wp.blockEditor;
const { PanelBody, RangeControl, SelectControl, Spinner } = wp.components;
const { TextControl, Button } = wp.components;
const { useSelect, useDispatch } = wp.data;
const { SVG, Path } = wp.components;

// Debounce function to limit API requests while typing
const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

//----------------------Dynamic Casino Block-------------------------

//Custom SVG icon for the Casino Block with Sorting
const casinoIcon = createElement(
  SVG,
  { width: 32, height: 32, viewBox: "0 0 200 100" },
  createElement(Path, {
    d: "M 6 22.956 C 6 23.910, 19.628 82.930, 20.615 86.250 C 21.071 87.784, 22.544 88, 32.567 88 C 38.855 88, 44.002 87.662, 44.004 87.250 C 44.012 85.692, 52.088 48.579, 52.510 48.156 C 53.204 47.463, 53.667 49.298, 57.777 69 L 61.635 87.500 73.080 87.780 L 84.524 88.059 91.908 56.280 C 95.969 38.801, 99.499 23.938, 99.753 23.250 C 100.103 22.300, 97.709 22, 89.793 22 L 79.372 22 75.946 40.500 C 74.062 50.675, 72.243 59, 71.905 59 C 71.567 59, 69.837 52.137, 68.060 43.750 C 66.283 35.362, 64.503 27.150, 64.103 25.500 L 63.377 22.500 53.279 22.216 L 43.180 21.932 42.173 26.716 C 41.619 29.347, 39.939 37.688, 38.441 45.250 C 36.942 52.813, 35.425 59, 35.070 59 C 34.716 59, 32.911 51.237, 31.061 41.750 C 29.210 32.263, 27.491 23.938, 27.241 23.250 C 26.687 21.729, 6 21.442, 6 22.956 M 105 55 L 105 88 115.500 88 L 126 88 126 77 L 126 66 136.843 66 C 150.200 66, 154.807 64.078, 159.460 56.565 C 162.011 52.446, 162.422 50.800, 162.436 44.643 C 162.461 33.301, 157.234 25.763, 147.500 23.104 C 145.257 22.491, 135.045 22.009, 124.250 22.006 L 105 22 105 55 M 126 44.639 L 126 52.278 132.231 51.713 C 136.999 51.280, 138.877 50.635, 140.231 48.963 C 142.695 45.920, 142.437 42.347, 139.545 39.455 C 137.530 37.439, 136.100 37, 131.545 37 L 126 37 126 44.639",
  })
);

registerBlockType("casino/dynamic-block", {
  title: "Dynamic Casino Block",
  icon: casinoIcon,
  category: "widgets",
  attributes: {
    numPosts: { type: "number", default: 5 },
    sortOrder: { type: "string", default: "desc" }, // 'asc' or 'desc'
    category: { type: "string", default: "" }, // Store the selected category from custom taxonomy
  },

  edit({ attributes, setAttributes }) {
    const { numPosts, sortOrder, category } = attributes;
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Fetch terms from custom taxonomy "casino-category"
      wp.apiFetch({ path: "/wp/v2/casino-category" })
        .then((data) => {
          const categoryOptions = data.map((cat) => ({
            label: cat.name,
            value: cat.slug,
          }));
          setCategories([
            { label: "All Categories", value: "" },
            ...categoryOptions,
          ]);
          setLoading(false);
        })
        .catch(() => {
          setCategories([{ label: "Error fetching categories", value: "" }]);
          setLoading(false);
        });
    }, []);

    return createElement("div", { className: "dynamic-casino-block" }, [
      createElement(
        InspectorControls,
        {},
        createElement(
          PanelBody,
          { title: "Casino Block Settings", initialOpen: true },
          createElement(RangeControl, {
            label: "Number of Posts",
            value: numPosts,
            onChange: (newNumPosts) => setAttributes({ numPosts: newNumPosts }),
            min: 1,
            max: 10,
          }),
          createElement(SelectControl, {
            label: "Sort Order",
            value: sortOrder,
            options: [
              { label: "Newest First", value: "desc" },
              { label: "Oldest First", value: "asc" },
            ],
            onChange: (newSortOrder) =>
              setAttributes({ sortOrder: newSortOrder }),
          }),
          loading
            ? createElement(Spinner, {})
            : createElement(SelectControl, {
                label: "Casino Category",
                value: category,
                options: categories,
                onChange: (newCategory) =>
                  setAttributes({ category: newCategory }),
              })
        )
      ),
      createElement(
        "p",
        {},
        `Displaying ${numPosts} posts | Sorted in: ${sortOrder} order!`
      ),
    ]);
  },

  save() {
    return null; // Server-side rendering
  },
});

//----------------------Single Casino Block-------------------------

// Register the Single Casino Search Block
registerBlockType("casino/single-casino-search-block", {
  title: "Single Casino Search Block",
  description: "Search and display a specific Casino post",
  category: "widgets",
  icon: casinoIcon,
  attributes: {
    specificPost: { type: "number", default: null },
    searchQuery: { type: "string", default: "" },
  },
  edit({ attributes, setAttributes }) {
    const { searchQuery, specificPost } = attributes;
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(specificPost); // Initialize with saved value
    const [selectedPostTitle, setSelectedPostTitle] = useState("");

    // Fetch all posts on initial load
    useEffect(() => {
      wp.apiFetch({ path: "/wp/v2/casino" }).then(setPosts);

      // If there's a specificPost saved, fetch its title
      if (specificPost) {
        wp.apiFetch({ path: `/wp/v2/casino/${specificPost}` }).then((post) => {
          setSelectedPostTitle(post.title.rendered);
        });
      }
    }, []);

    // Debounced search function
    const searchPosts = debounce(async (query) => {
      if (query) {
        const results = posts.filter((post) =>
          post.title.rendered.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredPosts(results);
      } else {
        setFilteredPosts(posts); // Show all posts if search query is empty
      }
    }, 300);

    // Handle search input change
    const handleSearchChange = (query) => {
      setAttributes({ searchQuery: query });
      searchPosts(query);
    };

    // Handle post selection
    const handlePostSelect = (postId, postTitle) => {
      setSelectedPost(postId); // Save the selected post ID
      setSelectedPostTitle(postTitle); // Save the selected post title
    };

    // Handle Save button click (clears search query and finalizes the post)
    const handleSave = () => {
      if (selectedPost) {
        setAttributes({ specificPost: selectedPost }); // Save the selected post
        setAttributes({ searchQuery: "" }); // Clear the search query
        setFilteredPosts([]); // Clear the filtered posts
        alert("Casino post has been saved.");
      } else {
        alert("Please select a post before saving.");
      }
    };

    return createElement(
      "div",
      { className: "casino-search-block" },
      createElement(TextControl, {
        label: "Search for a Casino Post",
        value: searchQuery,
        onChange: handleSearchChange,
      }),
      filteredPosts.length > 0 &&
        createElement(
          "ul",
          {},
          filteredPosts.map((post) =>
            createElement(
              "li",
              {
                key: post.id,
                onClick: () => handlePostSelect(post.id, post.title.rendered),
                style: {
                  cursor: "pointer",
                  fontWeight: post.id === selectedPost ? "bold" : "normal",
                }, // Bold for selected post
              },
              post.title.rendered
            )
          )
        ),
      selectedPostTitle &&
        createElement("p", {}, "Selected Casino Post: " + selectedPostTitle),
      createElement(
        Button,
        {
          isPrimary: true, // Make it a primary (blue) button
          onClick: handleSave,
          style: { marginTop: "10px" }, // Add some space above the button
        },
        "Save"
      )
    );
  },
  save() {
    return null; // Server-side rendering
  },
});
