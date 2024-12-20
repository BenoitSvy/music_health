// Global configuration
const config = {
  width: 600,
  height: 400,
  margin: { top: 40, right: 40, bottom: 60, left: 60 },
  transitionDuration: 1000,
  colors: {
    primary: getComputedStyle(document.documentElement)
      .getPropertyValue("--chart-primary")
      .trim(),
    scale: ["#2997ff", "#35c759", "#ff2d55", "#5856d6", "#ff9500"],
  },
};

// ScrollMagic initialization
const controller = new ScrollMagic.Controller();

// Main initialization function
async function createViz() {
  console.log("Initializing visualizations...");

  try {
    // Ensure containers are visible
    document.querySelectorAll(".section").forEach((section) => {
      section.style.display = "flex";
    });

    // Initialize container dimensions
    initContainerDimensions();

    // Load data
    const data = await d3.csv("./data/mental_health_dataset.csv");
    console.log("Data loaded:", data.length, "entries");

    // Initialize visualizations
    initAgeDistribution(data);
    console.log("Age distribution initialized");
    initStreamingPlatforms(data);
    console.log("Streaming platforms initialized");
    initListeningHours(data);
    console.log("Listening hours distribution initialized");
    initWorkCorrelation(data);
    console.log("Work correlation initialized");
    initGenreCloud(data);
    console.log("Genre cloud initialized");
    initExplorationStats(data);
    console.log("Exploration statistics initialized");
    initMentalHealthHeatmap(data);
    console.log("Mental health heatmap initialized");
    initMusicEffects(data);
    console.log("Music effects visualization initialized");

    // Initialize scroll animations
    initScrollAnimations();

    console.log("All visualizations successfully loaded!");
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Function to clean and prepare data
function preprocessData(data) {
  return data
    .map((d) => ({
      ...d,
      Age: +d.Age,
      HoursPerDay: +d["Hours per day"],
      Anxiety: +d.Anxiety,
      Depression: +d.Depression,
      Insomnia: +d.Insomnia,
      OCD: +d.OCD,
    }))
    .filter((d) => !isNaN(d.Age));
}

// Initialisation des animations au scroll
function initScrollAnimations() {
  const sections = document.querySelectorAll(".section");

  sections.forEach((section) => {
    new ScrollMagic.Scene({
      triggerElement: section,
      triggerHook: 0.8,
    })
      .setClassToggle(section, "visible")
      .addTo(controller);

    const visualizations = section.querySelectorAll(".visualization");
    visualizations.forEach((viz) => {
      new ScrollMagic.Scene({
        triggerElement: viz,
        triggerHook: 0.8,
      })
        .setClassToggle(viz, "visible")
        .addTo(controller);
    });
  });
}

// Function for age histogram
function initAgeDistribution(data) {
  console.log("Starting age distribution initialization...");
  const config = getConfig("age-distribution");
  config.margin.top = 20;
  config.margin.bottom = 20;

  const processedData = preprocessData(data);

  // Create SVG with viewBox for better responsiveness
  const svg = d3
    .select("#age-distribution")
    .append("svg")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg
    .append("g")
    .attr(
      "transform",
      `translate(${config.margin.left},${config.margin.top - 20})`
    );

  // Create histogram
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(processedData, (d) => d.Age)])
    .range([0, config.width - config.margin.left - config.margin.right]);

  const histogram = d3
    .histogram()
    .value((d) => d.Age)
    .domain(x.domain())
    .thresholds(
      d3.range(
        Math.floor(d3.min(processedData, (d) => d.Age)),
        Math.ceil(d3.max(processedData, (d) => d.Age)) + 1,
        1
      )
    );

  const bins = histogram(processedData);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length) * 1.1])
    .range([config.height - 40, 0]);

  // Add bars with styling class
  g.selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("class", "histogram-bar")
    .attr("x", (d) => x(d.x0))
    .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 0.5))
    .attr("y", (d) => y(d.length))
    .attr(
      "height",
      (d) =>
        config.height - config.margin.top - config.margin.bottom - y(d.length)
    )
    .on("mouseover", function (event, d) {
      const tooltip = g
        .append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${x(d.x0)},${y(d.length) - 10})`);

      tooltip
        .append("rect")
        .attr("class", "tooltip-bg")
        .attr("width", 120)
        .attr("height", 40)
        .attr("x", -60)
        .attr("y", -30)
        .attr("rx", 4)
        .attr("ry", 4);

      tooltip
        .append("text")
        .attr("class", "tooltip-text")
        .attr("text-anchor", "middle")
        .attr("y", -15)
        .text(`Age: ${Math.floor(d.x0)} years`);

      tooltip
        .append("text")
        .attr("class", "tooltip-text")
        .attr("text-anchor", "middle")
        .attr("y", 5)
        .text(`Count: ${d.length}`);
    })
    .on("mouseout", function () {
      g.selectAll(".tooltip").remove();
    });

  // Add axes
  const xAxis = g
    .append("g")
    .attr("class", "axis")
    .attr(
      "transform",
      `translate(0,${config.height - config.margin.top - config.margin.bottom})`
    )
    .call(
      d3
        .axisBottom(x)
        .ticks(
          d3.max(processedData, (d) => d.Age) -
            d3.min(processedData, (d) => d.Age)
        )
        .tickFormat((d, i) => (i % 2 === 0 ? d : ""))
    );

  const yAxis = g
    .append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5));

  // Axis labels
  xAxis
    .append("text")
    .attr("class", "axis-label")
    .attr("x", (config.width - config.margin.left - config.margin.right) / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .text(" ");

  yAxis
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", 15)
    .attr("text-anchor", "end")
    .text("Number of participants");
}

// Function for streaming platforms bar chart
function initStreamingPlatforms(data) {
  console.log("Starting streaming platforms initialization...");
  const config = getConfig("streaming-platforms");
  // Increase bottom margin to accommodate rotated labels
  config.margin.bottom = 80;

  const processedData = data.filter(
    (d) =>
      d["Primary streaming service"] && d["Primary streaming service"] !== ""
  );

  // Create SVG with viewBox for better responsiveness
  const svg = d3
    .select("#streaming-platforms")
    .append("svg")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Aggregate data
  const platformCounts = d3.rollup(
    processedData,
    (v) => v.length,
    (d) => d["Primary streaming service"]
  );

  // Define platform colors
  const platformColors = {
    Spotify: "#1DB954", // Vert Spotify
    "Apple Music": "#FC3C44", // Rouge Apple Music
    "YouTube Music": "#FF0000", // Rouge YouTube
    Pandora: "#3668FF", // Bleu Pandora
    "Other streaming service": "#86868b", // Gris
    "I do not use a streaming service.": "#d2d2d7", // Gris clair
  };

  const platformData = Array.from(platformCounts, ([key, value]) => ({
    platform: key,
    count: value,
  })).sort((a, b) => {
    // Put "I do not use" at the end, followed by "Other streaming service"
    if (a.platform === "I do not use a streaming service.") return 1;
    if (b.platform === "I do not use a streaming service.") return -1;
    if (a.platform === "Other streaming service") return 1;
    if (b.platform === "Other streaming service") return -1;
    // Sort remaining by number of users
    return b.count - a.count;
  });

  // Create scales
  const x = d3
    .scaleBand()
    .domain(platformData.map((d) => d.platform))
    .range([0, config.width - config.margin.left - config.margin.right])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(platformData, (d) => d.count)])
    .range([config.height - config.margin.top - config.margin.bottom, 0]);

  // Add bars with styling class
  g.selectAll("rect")
    .data(platformData)
    .join("rect")
    .attr("class", "histogram-bar")
    .attr("x", (d) => x(d.platform))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d.count))
    .attr(
      "height",
      (d) =>
        config.height - config.margin.top - config.margin.bottom - y(d.count)
    )
    .style("fill", (d) => platformColors[d.platform])
    .on("mouseover", function (event, d) {
      const tooltip = g
        .append("g")
        .attr("class", "tooltip")
        .attr(
          "transform",
          `translate(${x(d.platform) + x.bandwidth() / 2},${y(d.count) - 10})`
        );

      tooltip
        .append("rect")
        .attr("class", "tooltip-bg")
        .attr("width", 200)
        .attr("height", 60)
        .attr("x", -100)
        .attr("y", -40)
        .attr("rx", 4)
        .attr("ry", 4);

      tooltip
        .append("text")
        .attr("class", "tooltip-text")
        .attr("text-anchor", "middle")
        .attr("y", -20)
        .text(d.platform);

      tooltip
        .append("text")
        .attr("class", "tooltip-text")
        .attr("text-anchor", "middle")
        .attr("y", 10)
        .text(`Count: ${d.count}`);
    })
    .on("mouseout", function () {
      g.selectAll(".tooltip").remove();
    });

  // Add axes
  const xAxis = g
    .append("g")
    .attr("class", "axis")
    .attr(
      "transform",
      `translate(0,${config.height - config.margin.top - config.margin.bottom})`
    )
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "middle")
    .each(function (d) {
      const text = d3.select(this);
      const words = d.split(" ");
      text.text("");

      // Create tspan for each word
      let tspan = text.append("tspan").attr("x", 0).attr("dy", "1em");

      let line = "";
      words.forEach((word, i) => {
        if (line.length + word.length > 18) {
          // Reduce maximum line length
          // Adjust this value as needed
          tspan.text(line);
          line = word;
          tspan = text
            .append("tspan")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .text(word);
        } else {
          line = line ? line + " " + word : word;
          tspan.text(line);
        }
      });
    });

  // Increase bottom margin to accommodate longer labels
  config.margin.bottom = 100;

  const yAxis = g.append("g").attr("class", "axis").call(d3.axisLeft(y));

  // Axis labels

  g.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -(config.height - config.margin.top - config.margin.bottom) / 2)
    .attr("y", -40)
    .text("Number of Users");
}

// Function for violin plot of listening hours
function initListeningHours(data) {
  console.log("Starting listening hours initialization...");
  const config = getConfig("listening-hours");

  // Clean and prepare data and group by age
  const ageGroups = {
    "0-19": data
      .filter((d) => +d.Age < 20)
      .map((d) => ({ hours: +d["Hours per day"] }))
      .filter((d) => !isNaN(d.hours) && d.hours >= 0 && d.hours <= 24),
    "20-29": data
      .filter((d) => +d.Age >= 20 && +d.Age < 30)
      .map((d) => ({ hours: +d["Hours per day"] }))
      .filter((d) => !isNaN(d.hours) && d.hours >= 0 && d.hours <= 24),
    "30+": data
      .filter((d) => +d.Age >= 30)
      .map((d) => ({ hours: +d["Hours per day"] }))
      .filter((d) => !isNaN(d.hours) && d.hours >= 0 && d.hours <= 24),
  };

  // Create SVG
  const svg = d3
    .select("#listening-hours")
    .append("svg")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Y scale for hours
  const y = d3
    .scaleLinear()
    .domain([0, 24])
    .range([config.height - config.margin.top - config.margin.bottom, 0]);

  // X scale for age groups
  const x = d3
    .scaleBand()
    .domain(Object.keys(ageGroups))
    .range([0, config.width - config.margin.left - config.margin.right])
    .padding(0.2);

  // Function to create violin plot
  function createViolin(data, xPos, groupName) {
    // Statistics
    const mean = d3.mean(data, (d) => d.hours);
    const median = d3.median(data, (d) => d.hours);

    // Calculate density
    const kde = kernelDensityEstimator(kernelEpanechnikov(2), y.ticks(50));
    const density = kde(data.map((d) => d.hours));
    const maxDensity = d3.max(density, (d) => d[1]);

    // X scale for density
    const xScale = d3
      .scaleLinear()
      .domain([-maxDensity, maxDensity])
      .range([-(x.bandwidth() / 2), x.bandwidth() / 2]);

    // Create violin plot with smooth curve
    const area = d3
      .area()
      .curve(d3.curveCatmullRom)
      .x0((d) => xScale(-d[1]))
      .x1((d) => xScale(d[1]))
      .y((d) => y(d[0]));

    // Group for violin plot
    const violinG = g
      .append("g")
      .attr("transform", `translate(${xPos + x.bandwidth() / 2},0)`);

    // Create group for violin plot content
    const violinContent = violinG.append("g").attr("class", "violin-content");

    // Add invisible rectangle for mouse detection
    violinG
      .append("rect")
      .attr("class", "mouse-detector")
      .attr("x", -x.bandwidth() / 2)
      .attr("y", 0)
      .attr("width", x.bandwidth())
      .attr("height", config.height - config.margin.top - config.margin.bottom)
      .style("fill", "transparent")
      .style("pointer-events", "all")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const tooltip = g
          .append("g")
          .attr("class", "tooltip")
          .attr(
            "transform",
            `translate(${event.offsetX - config.margin.left},${
              event.offsetY - config.margin.top
            })`
          );

        tooltip
          .append("rect")
          .attr("class", "tooltip-bg")
          .attr("width", 220)
          .attr("height", 120)
          .attr("x", -20)
          .attr("y", -50)
          .attr("rx", 4)
          .attr("ry", 4);

        tooltip
          .append("text")
          .attr("class", "tooltip-text")
          .attr("text-anchor", "start")
          .attr("y", -25)
          .text(`Age Group: ${groupName}`);

        tooltip
          .append("text")
          .attr("class", "tooltip-text")
          .attr("text-anchor", "start")
          .attr("y", 0)
          .text(`Sample size: ${data.length}`);

        tooltip
          .append("text")
          .attr("class", "tooltip-text")
          .attr("text-anchor", "start")
          .attr("y", 25)
          .text(`Mean: ${mean.toFixed(1)} hours`);

        tooltip
          .append("text")
          .attr("class", "tooltip-text")
          .attr("text-anchor", "start")
          .attr("y", 50)
          .text(`Median: ${median.toFixed(1)} hours`);
      })
      .on("mousemove", function (event) {
        g.select(".tooltip").attr(
          "transform",
          `translate(${event.offsetX - config.margin.left},${
            event.offsetY - config.margin.top
          })`
        );
      })
      .on("mouseout", function (event) {
        // Check if mouse is still over an element of the violin plot
        const relatedTarget = event.relatedTarget;
        if (!violinG.node().contains(relatedTarget)) {
          g.selectAll(".tooltip").remove();
        }
      });

    // Draw violin
    violinContent
      .append("path")
      .datum(density)
      .attr("class", "violin")
      .attr("d", area)
      .style("fill", config.colors.primary)
      .style("opacity", 0.6);

    // Add mean line (traversing the entire violin)
    violinContent
      .append("line")
      .attr("x1", -x.bandwidth() / 2)
      .attr("x2", x.bandwidth() / 2)
      .attr("y1", y(mean))
      .attr("y2", y(mean))
      .style("stroke", "#ff2d55")
      .style("stroke-width", 3)
      .style("stroke-dasharray", "3,3");

    // Add median line (traversing the entire violin)
    violinContent
      .append("line")
      .attr("x1", -x.bandwidth() / 2)
      .attr("x2", x.bandwidth() / 2)
      .attr("y1", y(median))
      .attr("y2", y(median))
      .style("stroke", "#5856d6")
      .style("stroke-width", 3);

    // Add data points
    violinContent
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => (Math.random() - 0.5) * x.bandwidth() * 0.5)
      .attr("cy", (d) => y(d.hours + (Math.random() - 0.5) * 1.5))
      .attr("r", 2)
      .style("fill", "#000")
      .style("opacity", 0.3);
  }

  // Create three violin plots
  Object.entries(ageGroups).forEach(([group, data], i) => {
    createViolin(data, x(group), group);
  });

  // Add Y axis
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(12));

  // Add age group labels under each violin
  g.selectAll(".age-group-label")
    .data(Object.keys(ageGroups))
    .enter()
    .append("text")
    .attr("class", "age-group-label")
    .attr("text-anchor", "middle")
    .attr("x", (d) => x(d) + x.bandwidth() / 2)
    .attr("y", config.height - config.margin.top - config.margin.bottom + 25)
    .style("font-size", "16px")
    .style("font-weight", "600")
    .style("fill", "#86868b")
    .text((d) => `${d} years`);

  // Add Y axis label
  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -(config.height - config.margin.top - config.margin.bottom) / 2)
    .attr("text-anchor", "middle")
    .text("Hours per Day");

  // Add legend
  const legend = g
    .append("g")
    .attr("class", "legend")
    .attr(
      "transform",
      `translate(${config.width - config.margin.right - 150}, 20)`
    );

  // Median legend
  legend
    .append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 0)
    .attr("y2", 0)
    .style("stroke", "#5856d6")
    .style("stroke-width", 2);

  legend.append("text").attr("x", 30).attr("y", 5).text(`Median`);

  // Mean legend
  legend
    .append("line")
    .attr("x1", 0)
    .attr("x2", 20)
    .attr("y1", 25)
    .attr("y2", 25)
    .style("stroke", "#ff2d55")
    .style("stroke-width", 2)
    .style("stroke-dasharray", "4,4");

  legend.append("text").attr("x", 30).attr("y", 30).text(`Mean`);
}

// Work-Age Correlation Visualization
function initWorkCorrelation(data) {
  console.log("Starting work correlation initialization...");
  const config = getConfig("work-correlation");

  // Clean and prepare data
  const processedData = data
    .filter((d) => !isNaN(+d.Age) && d["While working"] !== "")
    .map((d) => ({
      age: +d.Age,
      workingWithMusic: d["While working"] === "Yes",
    }));

  // Create age groups of 5 years
  const ageGroups = {};
  processedData.forEach((d) => {
    const ageGroup = Math.floor(d.age / 15) * 15;
    if (!ageGroups[ageGroup]) {
      ageGroups[ageGroup] = { total: 0, yes: 0 };
    }
    ageGroups[ageGroup].total++;
    if (d.workingWithMusic) ageGroups[ageGroup].yes++;
  });

  // Calculate proportions
  const proportionData = Object.entries(ageGroups)
    .map(([age, counts]) => ({
      ageGroup: `${age}-${+age + 14}`,
      proportion: (counts.yes / counts.total) * 100,
      total: counts.total,
    }))
    .sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));

  // Create SVG
  const svg = d3
    .select("#work-correlation")
    .append("svg")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Scales
  const x = d3
    .scaleBand()
    .domain(proportionData.map((d) => d.ageGroup))
    .range([0, config.width - config.margin.left - config.margin.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, 100])
    .range([config.height - config.margin.top - config.margin.bottom, 0]);

  // Add color scale
  const colorScale = d3
    .scaleSequential(d3.interpolateRdYlGn) // Red for low, yellow for medium, green for high
    .domain([0, 100]);

  // Bars
  g.selectAll("rect")
    .data(proportionData)
    .join("rect")
    .attr("class", "histogram-bar")
    .attr("x", (d) => x(d.ageGroup))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d.proportion))
    .attr(
      "height",
      (d) =>
        config.height -
        config.margin.top -
        config.margin.bottom -
        y(d.proportion)
    )
    .style("fill", (d) => colorScale(d.proportion))
    .style("opacity", 0.7)
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1)
        .style("fill", (d) => d3.color(colorScale(d.proportion)).darker(0.3));

      const tooltip = g
        .append("g")
        .attr("class", "tooltip")
        .attr(
          "transform",
          `translate(${x(d.ageGroup) + x.bandwidth() / 2},${
            y(d.proportion) - 10
          })`
        );

      tooltip
        .append("rect")
        .attr("fill", "rgba(0,0,0,0.8)")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", 160)
        .attr("height", 50)
        .attr("x", -80)
        .attr("y", -45);

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -25)
        .text(`Age: ${d.ageGroup} years`);

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -5)
        .text(`${d.proportion.toFixed(1)}% work with music`);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 0.7)
        .style("fill", (d) => colorScale(d.proportion));
    });
}

// Function for genre cloud word cloud
function initGenreCloud(data) {
  console.log("Starting genre cloud initialization...");
  const config = getConfig("genre-cloud");
  config.height = config.height * 1.5;

  const processedData = data.filter(
    (d) => d["Fav genre"] && d["Fav genre"] !== ""
  );

  const genreCounts = d3.rollup(
    processedData,
    (v) => v.length,
    (d) => d["Fav genre"]
  );

  const totalResponses = processedData.length;

  // Class to handle word movement
  class WordParticle {
    constructor(word, x, y) {
      this.word = word;
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = (Math.random() - 0.5) * 2;
      this.initialX = x;
      this.initialY = y;
      this.mass = word.size;
    }

    update(particles) {
      // Forces between particles
      particles.forEach((other) => {
        if (other === this) return;

        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 3) return; // Minimum distance reduced

        // Repulsion force inversely proportional to the square of the distance
        const combinedSize = this.mass + other.word.size;
        const repulsion = (combinedSize * 800) / (distance * distance); // Reduced repulsion force

        this.vx -= ((dx / distance) * repulsion) / this.mass;
        this.vy -= ((dy / distance) * repulsion) / this.mass;

        // Weak attraction force to keep words grouped
        const attraction = distance * 0.00003; // Slight increase in attraction
        this.vx += (dx / distance) * attraction;
        this.vy += (dy / distance) * attraction;
      });

      // Weak force towards the center
      const centerX = 0;
      const centerY = 0;
      const toCenterX = centerX - this.x;
      const toCenterY = centerY - this.y;
      const distanceToCenter = Math.sqrt(
        toCenterX * toCenterX + toCenterY * toCenterY
      );
      this.vx += (toCenterX / distanceToCenter) * 0.04; // Weak central force slightly increased
      this.vy += (toCenterY / distanceToCenter) * 0.04;

      // Damping
      this.vx *= 0.99; // Reduce damping
      this.vy *= 0.99;

      // Update position
      this.x += this.vx;
      this.y += this.vy;
    }
  }

  const words = Array.from(genreCounts, ([text, size]) => ({
    text,
    size: Math.max(30, (size / totalResponses) * 100 * 5),
    count: size,
    percentage: ((size / totalResponses) * 100).toFixed(1),
    particle: null,
  }));

  // Create container for percentage display
  const statsContainer = d3
    .select("#genre-cloud")
    .append("div")
    .attr("class", "stats-container")
    .style("position", "absolute")
    .style("top", "50%")
    .style("right", "10px")
    .style("transform", "translateY(-50%)")
    .style("font-size", "20px")
    .style("font-family", "Arial")
    .style("color", "#86868b")
    .style("background-color", "rgba(255, 255, 255, 0.9)")
    .style("padding", "10px")
    .style("border-radius", "4px")
    .style("opacity", "0");

  // Create word cloud layout
  const layout = d3.layout
    .cloud()
    .size([
      config.width - config.margin.left - config.margin.right,
      config.height - config.margin.top - config.margin.bottom,
    ])
    .words(words)
    .padding(10)
    .rotate(0)
    .text((d) => d.text)
    .fontSize((d) => d.size)
    .spiral("archimedean")
    .random(() => {
      // Position spéciale pour "Rock"
      return (text) => {
        if (text === "Rock") {
          return { x: 0, y: -50 }; // Positionner "Rock" plus haut
        }
        return Math.random(); // Position aléatoire pour les autres mots
      };
    })
    .on("end", draw);

  layout.start();

  function draw(words) {
    const svg = d3
      .select("#genre-cloud")
      .append("svg")
      .attr("viewBox", `0 0 ${config.width} ${config.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${config.width / 2},${config.height / 2})`);

    // Initialize particles for each word
    words.forEach((word) => {
      word.particle = new WordParticle(word, word.x, word.y);
    });

    // Animation function
    function animate() {
      // Update particle positions
      words.forEach((word) => {
        word.particle.update(words.map((w) => w.particle));
      });

      // Update text positions
      g.selectAll("text").attr(
        "transform",
        (d) => `translate(${d.particle.x},${d.particle.y})`
      );

      requestAnimationFrame(animate);
    }

    const texts = g
      .selectAll("text")
      .data(words)
      .enter()
      .append("text")
      .style("font-size", (d) => `${d.size}px`)
      .style("font-family", "Arial")
      .style("fill", config.colors.primary)
      .style("cursor", "grab")
      .attr("text-anchor", "middle")
      .attr("transform", (d) => `translate(${d.particle.x},${d.particle.y})`)
      .text((d) => d.text)
      .style("user-select", "none")
      .on("mouseover", function (event, d) {
        // Mettre à jour le style du mot
        d3.select(this)
          .transition()
          .duration(200)
          .style("font-size", `${d.size * 1.2}px`)
          .style("fill", "#ff2d55"); // Couleur d'accent

        // Créer un div de tooltip qui suit la souris
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "genre-tooltip")
          .style("position", "absolute")
          .style("background-color", "rgba(0, 0, 0, 0.8)")
          .style("color", "white")
          .style("padding", "8px 12px")
          .style("border-radius", "4px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("opacity", 0)
          .text(
            `${((d.count / totalResponses) * 100).toFixed(1)}% of listeners`
          );

        // Function to update tooltip position
        function updateTooltipPosition(event) {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 10 + "px");
        }

        // Initialize position and opacity
        updateTooltipPosition(event);
        tooltip.transition().duration(200).style("opacity", 1);

        // Add mouse movement listener
        d3.select(this).on("mousemove", function (event) {
          updateTooltipPosition(event);
        });
      })
      .on("mouseout", function () {
        // Restaurer le style du mot
        d3.select(this)
          .transition()
          .duration(200)
          .style("font-size", (d) => `${d.size}px`)
          .style("fill", config.colors.primary);

        d3.selectAll(".genre-tooltip")
          .transition()
          .duration(200)
          .style("opacity", 0)
          .remove();
      })
      .call(
        d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      );

    function dragstarted(event) {
      d3.select(this).style("cursor", "grabbing");
      const word = d3.select(this).datum();
      word.particle.isDragging = true;
      word.particle.dragOffsetX = word.particle.x - event.x;
      word.particle.dragOffsetY = word.particle.y - event.y;
    }

    function dragged(event, d) {
      const targetX = event.x + d.particle.dragOffsetX;
      const targetY = event.y + d.particle.dragOffsetY;

      d.particle.vx = (targetX - d.particle.x) * 0.3;
      d.particle.vy = (targetY - d.particle.y) * 0.3;

      d.particle.x += d.particle.vx;
      d.particle.y += d.particle.vy;
    }

    function dragended(event, d) {
      d3.select(this).style("cursor", "grab");
      d.particle.isDragging = false;
      d.particle.vx *= 2;
      d.particle.vy *= 2;
    }

    // Start animation
    animate();
  }
}

// Function for exploration statistics (2 pie charts)
function initExplorationStats(data) {
  console.log("Starting exploration statistics initialization...");
  const config = getConfig("exploration-stats");
  config.height = config.height * 1.5;

  const svg = d3
    .select("#exploration-stats")
    .append("svg")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // First pie chart (Exploratory)
  const exploratoryG = svg
    .append("g")
    .attr("transform", `translate(${config.width / 4},${config.height / 2.2})`);

  // Second pie chart (Foreign Languages)
  const languageG = svg
    .append("g")
    .attr(
      "transform",
      `translate(${(3 * config.width) / 4},${config.height / 2.2})`
    );

  // Calculate data for pie charts
  const explorationData = d3.rollup(
    data.filter((d) => d["Exploratory"] === "Yes" || d["Exploratory"] === "No"),
    (v) => v.length,
    (d) => d["Exploratory"]
  );

  const foreignLangData = d3.rollup(
    data.filter(
      (d) => d["Foreign languages"] === "Yes" || d["Foreign languages"] === "No"
    ),
    (v) => v.length,
    (d) => d["Foreign languages"]
  );

  // Calculate total responses for each category
  const totalExploration = Array.from(explorationData.values()).reduce(
    (a, b) => a + b,
    0
  );
  const totalForeignLang = Array.from(foreignLangData.values()).reduce(
    (a, b) => a + b,
    0
  );

  const pie = d3.pie().value((d) => d[1]);
  const pieData = pie(Array.from(explorationData));
  const langPieData = pie(Array.from(foreignLangData));

  const radius = Math.min(config.width / 3, config.height) / 2;

  const arc = d3
    .arc()
    .innerRadius(radius * 0.3)
    .outerRadius(radius);

  // Function to create pie chart with animation
  function createPieChart(g, data, title, total) {
    const paths = g
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", d3.arc().innerRadius(0).outerRadius(0))
      .attr("fill", (d, i) => config.colors.scale[i])
      .attr("stroke", "white")
      .attr("stroke-width", 4);

    // Add title
    g.append("text")
      .attr("class", "pie-title")
      .attr("y", -radius - 30)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("fill", "#86868b")
      .text(title);

    const labelArc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    g.selectAll(".pie-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "pie-label")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("font-weight", "600")
      .style("fill", "white")
      .style("opacity", "0")
      .text((d) => {
        const percentage = ((d.data[1] / total) * 100).toFixed(1);
        return `${d.data[0]}\n${percentage}%`;
      })
      .call(wrap, 40);

    // Function to handle line breaks in text
    function wrap(text, width) {
      text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\n/);
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));

        text.text(null);

        words.forEach((word, i) => {
          text
            .append("tspan")
            .attr("x", 0)
            .attr("y", y)
            .attr("dy", i === 0 ? dy + "em" : "1.2em")
            .text(word);
        });
      });
    }

    return paths;
  }

  // Create two pie charts with correct totals
  const exploratoryPaths = createPieChart(
    exploratoryG,
    pieData,
    "Do you listener to various genres?",
    totalExploration
  );
  const languagePaths = createPieChart(
    languageG,
    langPieData,
    "Do you listen to foreign languages musics?",
    totalForeignLang
  );

  // Animation on scroll
  new ScrollMagic.Scene({
    triggerElement: "#exploration-stats",
    triggerHook: 0.9,
    duration: "70%",
  })
    .on("progress", function (e) {
      // Start animation only after 20% of scroll
      const delayedProgress = Math.max(0, (e.progress - 0.2) / 0.8);

      // Animation of arcs with acceleration curve
      const easeProgress = d3.easeCubicOut(Math.min(1, delayedProgress));
      const currentArc = d3
        .arc()
        .innerRadius(radius * 0.3 * easeProgress)
        .outerRadius(radius * easeProgress);

      exploratoryPaths.attr("d", currentArc);
      languagePaths.attr("d", currentArc);

      // Animation of labels
      setTimeout(() => {
        exploratoryG.selectAll(".pie-label").style("opacity", easeProgress);
        languageG.selectAll(".pie-label").style("opacity", easeProgress);
      }, 200);
    })
    .addTo(controller);
}

// Function for mental health heatmap
function initMentalHealthHeatmap(data) {
  console.log("Starting mental health heatmap initialization...");
  const config = getConfig("mental-health-heatmap");

  // Define mental factors
  const mentalFactors = ["Anxiety", "Depression", "Insomnia", "OCD"];

  // Prepare data for heatmap
  const genres = Array.from(new Set(data.map((d) => d["Fav genre"])));

  // Calculate averages by genre and factor
  const averages = new Map();
  genres.forEach((genre) => {
    const genreData = data.filter((d) => d["Fav genre"] === genre);
    mentalFactors.forEach((factor) => {
      const avg = d3.mean(genreData, (d) => +d[factor]);
      averages.set(`${genre}-${factor}`, avg);
    });
  });

  const heatmapData = genres.flatMap((genre) =>
    mentalFactors.map((factor) => ({
      genre,
      factor,
      value: averages.get(`${genre}-${factor}`) || 0,
    }))
  );

  // Find min and max values to normalize the scale
  const minValue = d3.min(heatmapData, (d) => d.value);
  const maxValue = d3.max(heatmapData, (d) => d.value);

  // Create color scale
  const colorScale = d3
    .scaleSequential(d3.interpolateReds)
    .domain([minValue, maxValue]);

  const svg = d3
    .select("#mental-health-heatmap")
    .append("svg")
    .attr("width", config.width)
    .attr("height", config.height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Scales
  const x = d3
    .scaleBand()
    .domain(genres)
    .range([0, config.width - config.margin.left - config.margin.right])
    .padding(0.1);

  const y = d3
    .scaleBand()
    .domain(mentalFactors)
    .range([0, config.height - config.margin.top - config.margin.bottom])
    .padding(0.1);

  // Add heatmap cells
  g.selectAll("rect")
    .data(heatmapData)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.genre))
    .attr("y", (d) => y(d.factor))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", (d) => colorScale(d.value))
    .attr("opacity", 0)
    .on("mouseover", function (event, d) {
      const tooltip = g
        .append("g")
        .attr("class", "tooltip")
        .attr(
          "transform",
          `translate(${x(d.genre) + x.bandwidth() / 2},${y(d.factor) - 10})`
        );

      tooltip
        .append("rect")
        .attr("fill", "rgba(0,0,0,0.8)")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", 280)
        .attr("height", 100)
        .attr("x", -140)
        .attr("y", -80);

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -55)
        .text(`${d.genre}`);

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -30)
        .text(`Average ${d.factor} score`);

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -5)
        .text(`for this genre: ${d.value.toFixed(2)}/10`);
    })
    .on("mouseout", function () {
      g.selectAll(".tooltip").remove();
    });

  // Prepare cells for animation
  g.selectAll("rect").style("transform", "scale(0)").style("opacity", "0");

  // Animation on scroll
  new ScrollMagic.Scene({
    triggerElement: "#mental-health-heatmap",
    triggerHook: 0.7,
  })
    .on("enter", () => {
      // Trigger animation of cells
      g.selectAll("rect")
        .transition()
        .duration(400)
        .delay((d, i) => i * 20)
        .style("transform", "scale(1)")
        .style("opacity", "1");

      // Animation of axes and legend after cells
      setTimeout(() => {
        xAxisGroup.transition().duration(600).style("opacity", "1");
        xLabels.transition().duration(600).delay(300).style("opacity", "1");
        yAxisGroup.transition().duration(600).style("opacity", "1");
        legend.transition().duration(600).style("opacity", "1");
      }, heatmapData.length * 20 + 400);
    })
    .on("leave", () => {
      // Reset animation when scrolling back up
      g.selectAll("rect")
        .transition()
        .duration(200)
        .style("transform", "scale(0)")
        .style("opacity", "0");

      xAxisGroup.transition().duration(200).style("opacity", "0");
      xLabels.transition().duration(200).style("opacity", "0");
      yAxisGroup.transition().duration(200).style("opacity", "0");
      legend.transition().duration(200).style("opacity", "0");
    })
    .addTo(controller);

  // Hide axes initially
  const xAxisGroup = g
    .append("g")
    .attr(
      "transform",
      `translate(0,${config.height - config.margin.top - config.margin.bottom})`
    )
    .style("opacity", "0")
    .call(d3.axisBottom(x));

  // Hide genre labels initially
  const xLabels = xAxisGroup
    .selectAll("text")
    .style("opacity", "0")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("fill", "#86868b")
    .each(function (d) {
      const text = d3.select(this);
      if (d.length > 15) {
        const words = d.split(" ");
        let line = "";
        let lines = [];

        words.forEach((word) => {
          if ((line + " " + word).length > 15) {
            lines.push(line);
            line = word;
          } else {
            line = line ? line + " " + word : word;
          }
        });
        if (line) lines.push(line);

        text.text("");
        lines.forEach((line, i) => {
          text
            .append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? 0 : "1.2em")
            .text(line);
        });
      }
    });

  const yAxisGroup = g.append("g").style("opacity", "0").call(d3.axisLeft(y));

  // Color legend
  const legendWidth = 20;
  const legendHeight = config.height - config.margin.top - config.margin.bottom;

  const legendScale = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([legendHeight, 0]);

  const legend = svg
    .append("g")
    .style("opacity", "0")
    .attr(
      "transform",
      `translate(${config.width - config.margin.right + 40},${
        config.margin.top
      })`
    );

  const legendGradient = legend
    .append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  const stops = colorScale.ticks().map((t, i, n) => ({
    offset: `${(100 * i) / n.length}%`,
    color: colorScale(t),
  }));

  legendGradient
    .selectAll("stop")
    .data(stops)
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  // Rectangle with gradient
  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // Axis for legend
  const colorLegendScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([legendHeight, 0]);

  const legendAxis = d3.axisRight(colorLegendScale).tickFormat((d) => `${d}%`);

  legend
    .append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

  // Legend title
  legend
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -legendHeight / 2)
    .attr("y", -25)
    .style("text-anchor", "middle")
    .text("Average Mental Health Score");

  // Add grid
  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .call(
      d3
        .axisLeft(y)
        .tickSize(-config.width + config.margin.left + config.margin.right)
        .tickFormat("")
        .ticks(20)
    );

  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .attr(
      "transform",
      `translate(0,${config.height - config.margin.top - config.margin.bottom})`
    )
    .call(
      d3
        .axisBottom(x)
        .tickSize(config.height - config.margin.top - config.margin.bottom)
        .tickFormat("")
        .ticks(20)
    );
}

// Music Effects Visualization
function initMusicEffects(data) {
  console.log("Starting music effects visualization initialization...");
  const config = getConfig("music-effects");
  // Increase bottom margin to include X axis and label
  config.margin.bottom = 100;

  // Calculate statistics by genre
  console.log("Raw data sample:", data.slice(0, 5));

  const genreStats = d3.rollup(
    data,
    (v) => {
      // First filter to keep only entries with valid BPM
      const validEntries = v.filter(
        (d) => d["BPM"] && !isNaN(+d["BPM"]) && +d["BPM"] > 0
      );

      return {
        total: validEntries.length, // Use only the number of valid entries
        improved: validEntries.filter((d) => d["Music effects"] === "Improve")
          .length,
        avgBPM: (() => {
          return validEntries.length > 0
            ? d3.mean(validEntries, (d) => +d["BPM"])
            : null;
        })(),
        validBPM: validEntries.length,
      };
    },
    (d) => d["Fav genre"]
  );

  // Log for debugging
  console.log("Genre stats:", Array.from(genreStats.entries()));

  // Prepare data for chart
  const plotData = Array.from(genreStats, ([genre, stats]) => ({
    genre,
    bpm: stats.avgBPM,
    improvement: (stats.improved / stats.total) * 100,
    total: stats.total,
    validBPM: stats.validBPM,
  })).filter((d) => d.genre !== "" && d.validBPM > 0); // Exclude empty genres and without valid BPM

  // Create SVG
  const svg = d3
    .select("#music-effects")
    .append("svg")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Scales
  const x = d3
    .scaleLinear()
    .domain([
      d3.min(plotData, (d) => d.bpm) * 0.95,
      d3.max(plotData, (d) => d.bpm) * 1.05,
    ])
    .range([0, config.width - config.margin.left - config.margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, 100])
    .range([config.height - config.margin.top - config.margin.bottom, 0]);

  const size = d3
    .scaleSqrt()
    .domain([0, d3.max(plotData, (d) => d.total)])
    .range([5, 25]);

  // Color scale for improvement percentage
  const colorScale = d3
    .scaleSequential(d3.interpolateRdYlGn) // Red for low, yellow for medium, green for high
    .domain([0, 100]);

  // Add axes
  const xAxis = g
    .append("g")
    .attr(
      "transform",
      `translate(0,${config.height - config.margin.top - config.margin.bottom})`
    )
    .call(d3.axisBottom(x).ticks(8));

  const yAxis = g.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

  // Add horizontal grid lines
  g.selectAll("line.grid-line-horizontal")
    .data(y.ticks(5)) // 5 lines for 20% intervals
    .enter()
    .append("line")
    .attr("class", "grid-line-horizontal")
    .attr("x1", 0)
    .attr("x2", config.width - config.margin.left - config.margin.right)
    .attr("y1", (d) => y(d))
    .attr("y2", (d) => y(d))
    .style("stroke", "#aaa")
    .style("stroke-width", 1)
    .style("opacity", 0.3);

  // Add vertical grid lines
  g.selectAll("line.grid-line-vertical")
    .data(x.ticks(10))
    .enter()
    .append("line")
    .attr("class", "grid-line-vertical")
    .attr("x1", (d) => x(d))
    .attr("x2", (d) => x(d))
    .attr("y1", 0)
    .attr("y2", config.height - config.margin.top - config.margin.bottom)
    .style("stroke", "#aaa")
    .style("stroke-width", 1)
    .style("opacity", 0.3);

  // Axis labels
  g.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", (config.width - config.margin.left - config.margin.right) / 2)
    .attr("y", config.height - config.margin.top - config.margin.bottom + 50)
    .text("Average BPM");

  g.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -(config.height - config.margin.top - config.margin.bottom) / 2)
    .attr("y", -50)
    .text("Improvement Percentage");

  // Create points
  const points = g
    .selectAll("circle")
    .data(plotData)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.bpm))
    .attr("cy", (d) => y(d.improvement))
    .attr("r", 0) // Start with radius of 0
    .style("fill", (d) => colorScale(d.improvement))
    .style("opacity", 0)
    .style("stroke", "white")
    .style("stroke-width", 1);

  // Animation on scroll
  new ScrollMagic.Scene({
    triggerElement: "#music-effects",
    triggerHook: 0.7,
  })
    .on("enter", () => {
      points
        .transition()
        .duration(800)
        .delay((d, i) => i * 50) // Progressive delay for each circle
        .attr("r", (d) => size(d.total))
        .style("opacity", 0.7);
    })
    .on("leave", () => {
      points.transition().duration(400).attr("r", 0).style("opacity", 0);
    })
    .addTo(controller);

  // Add tooltips
  points
    .on("mouseover", function (event, d) {
      // Highlight hovered point
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 0.9) // Increase opacity
        .style("fill", (d) => d3.color(colorScale(d.improvement)).darker(0.5)) // Darker color
        .attr("r", (d) => size(d.total) * 1.2)
        .style("stroke-width", 3);

      const tooltip = g
        .append("g")
        .attr("class", "tooltip")
        .attr(
          "transform",
          `translate(${x(d.bpm)},${y(d.improvement) - 80})` // A bit lower
        );

      tooltip
        .append("rect")
        .attr("fill", "rgba(0,0,0,0.8)")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("width", 280)
        .attr("height", 100)
        .attr("x", -140)
        .attr("y", -70); // Adjust to center text properly in the rectangle

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -45)
        .text(d.genre)
        .style("font-weight", "bold");

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", -20)
        .text(`Average BPM: ${d.bpm.toFixed(1)} (${d.validBPM} samples)`);

      tooltip
        .append("text")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("y", 5)
        .text(`Improvement: ${d.improvement.toFixed(1)}% of listeners`);

      // Oscillation animation
      const circle = d3.select(this);
      function oscillate() {
        circle
          .transition()
          .duration(500) // Short duration of 500ms
          .attr("r", (d) => size(d.total) * 1.3)
          .transition()
          .duration(500) // Short duration of 500ms
          .attr("r", (d) => size(d.total) * 1.1)
          .on("end", oscillate);
      }
      oscillate();
    })
    .on("mouseout", function (d) {
      g.selectAll(".tooltip").remove();
      // Stop current animation
      d3.select(this).interrupt();
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 0.7)
        .style("fill", (d) => colorScale(d.improvement)) // Return to normal color
        .attr("r", (d) => size(d.total))
        .style("stroke-width", 1);
    });

  // Add legend for circle sizes
  const legendSizes = [
    d3.min(plotData, (d) => d.total),
    d3.median(plotData, (d) => d.total),
    d3.max(plotData, (d) => d.total),
  ];

  const legend = g
    .append("g")
    .attr(
      "transform",
      `translate(${config.width - config.margin.right - 120}, 20)`
    );

  legend
    .selectAll("circle")
    .data(legendSizes)
    .enter()
    .append("circle")
    .attr("cx", 0)
    .attr("cy", (d, i) => i * 40)
    .attr("r", (d) => size(d))
    .style("fill", "none")
    .style("stroke", "#86868b")
    .style("stroke-width", 1);

  legend
    .selectAll("text")
    .data(legendSizes)
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", (d, i) => i * 40 + 5)
    .text((d) => `${d} users`)
    .style("fill", "#86868b")
    .style("font-size", "12px");

  // Add color legend
  const legendHeight = 200;
  const legendWidth = 20;

  const colorLegend = g
    .append("g")
    .attr(
      "transform",
      `translate(${config.width - config.margin.right - 80}, ${
        config.height / 2 - legendHeight / 2
      })`
    );

  // Gradient for legend
  const defs = svg.append("defs");
  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "color-legend-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  // Add gradient stops
  linearGradient
    .selectAll("stop")
    .data(d3.range(0, 1.1, 0.1))
    .enter()
    .append("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => colorScale(d * 100));

  // Rectangle with gradient
  colorLegend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#color-legend-gradient)");

  // Axis for legend
  const colorLegendScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([legendHeight, 0]);

  const legendAxis = d3.axisRight(colorLegendScale).tickFormat((d) => `${d}%`);

  colorLegend
    .append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);

  // Legend title
  colorLegend
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -legendHeight / 2)
    .attr("y", -25)
    .style("text-anchor", "middle")
    .text("Improvement Rate");

  // Add grid
  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .call(
      d3
        .axisLeft(y)
        .tickSize(-config.width + config.margin.left + config.margin.right)
        .tickFormat("")
        .ticks(20)
    );

  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .attr(
      "transform",
      `translate(0,${config.height - config.margin.top - config.margin.bottom})`
    )
    .call(
      d3
        .axisBottom(x)
        .tickSize(config.height - config.margin.top - config.margin.bottom)
        .tickFormat("")
        .ticks(20)
    );
}

// Add at the beginning of the file, just after the configuration
function getContainerDimensions(containerId) {
  const container = document.getElementById(containerId);
  const rect = container.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}

// Modify configuration to be a function
function getConfig(containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return defaultConfig;
  }

  const rect = container.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn(`Container ${containerId} has zero dimensions`);
    return defaultConfig;
  }

  return {
    width: rect.width - 60, // 60px for padding
    height: rect.height - 60,
    margin: { top: 40, right: 40, bottom: 60, left: 60 },
    transitionDuration: 1000,
    colors: config.colors,
  };
}

const defaultConfig = {
  width: 500,
  height: 300,
  margin: { top: 40, right: 40, bottom: 60, left: 60 },
  transitionDuration: 1000,
  colors: config.colors,
};

// Function to initialize container dimensions
function initContainerDimensions() {
  const visualizations = document.querySelectorAll(".visualization");
  visualizations.forEach((viz) => {
    if (!isElementVisible(viz)) {
      console.warn(`Visualization container ${viz.id} is not visible`);
      return;
    }
    const parent = viz.parentElement;
    const parentWidth = parent.clientWidth;
    viz.style.width = `${parentWidth}px`;
  });
}

// Handle resizing
window.addEventListener("resize", () => {
  initContainerDimensions();
  // Update dimensions of existing SVGs instead of recreating
  document.querySelectorAll(".visualization").forEach((viz) => {
    if (viz.id) {
      resizeSvg(viz.id);
    }
  });
});

// Application launch
document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit to ensure everything is loaded
  setTimeout(() => {
    createViz();
  }, 100);
});

function resizeSvg(containerId) {
  const container = document.getElementById(containerId);
  const svg = container.querySelector("svg");
  if (svg) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    svg.setAttribute("width", containerWidth);
    svg.setAttribute("height", containerHeight);
  }
}

function isElementVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// Utility function for kernel density estimation
function kernelDensityEstimator(kernel, X) {
  return function (V) {
    return X.map((x) => [x, d3.mean(V, (v) => kernel(x - v))]);
  };
}

function kernelEpanechnikov(k) {
  return function (v) {
    return Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0;
  };
}
