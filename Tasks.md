# Ideas
- Choreographic the footwork (core feature)
- Include musicality and choreographing with the music (crafting for the whole song)
- generating 3D animations based on the footwork
- include handwork
- a scripting language made for west coast swing dance that can describe, firstly the footwork in a compact manner
- connect it to a patterns tree and show which patterns share a similar footwork


# TODOs

## Basic controls
- [x] pattern selector e.g. sugar push, whip, etc.
- [ ] leader/follower
    - [x] option to select either
    - [ ] or both
- [x] display or editor mode
- [x] each pattern config file must contain the footwork for both roles and metadata
- [ ] script window feature that allows setting up the step sequence and leg work


## Visualization
- [x] add an option to determine how many previous steps to show for each leg (lag 1, 2, .., or all), set the default to be 2. So, for example, for lag-2 we will have start step (0), 1, 2, and when showing 3, we hide the start step for L. and similarly, on & we hide the start step for R.
    - [x] make the visible lagged steps slightly opac
- [x] toggle showing edges between each step
- [x] the edges must be only between the same leg and not across legs, it's basically a way to easier track the same leg
    - [ ] draw a smooth curves rather than straight line (which could be important for more complex footworks)
- [x] first person role selecter: follower or leader as the role to be selected which means the first person view should be from point of view of that role, i.e. that role should be shown on the anchor side.
    - [ ] if user wanted to show the opposite role for the reference then have a option to activate opposite role (might be challenging if leader/follower steps are not written at the same time, then the scales won't match and require editing -- for the simple version ignore this and assume that both footworks, i.e. for both leader and follower are developed at the same time)
- [x] Starting step position:
    - begin from start position (as if both legs are placed on the start position)
    - to be opac grey
    - by default located in the center (slightly off-center horizontally southwards)
    - make it possible to select and move/edit and show the details of the start steps on the right side panel.
    - default angles: L: -15 degrees and R: +30 degrees.
- [ ] improve graphic/geometry of the visualized step 
- [ ] which part of the foot should land first (main pressure point)
- [ ] add options to adjust the view, such as zoom, movable view window, size of the foot step on the visualization, etc.
- [ ] make it possible to create animation and save as gif or other similar formats
    - [ ] make the speed adjustable
    - [ ] put a beat on it
    - [ ] put a voice on it that counts the steps in steps or numbers
- [ ] make image exports that put the whole pattern in terms of static images side by side per each 2 beats, i.e. each side-by-side image contains two beats at a time so that things won't overlap.
- [ ] add a view option that when toggled it would translate the patterns into the first person view coordinate system so the visualization view would move with the person (this would improve UX especially for patterns that the side changes, such as left side pass, whip, etc.) 
- [ ] move display options to a place where it is hidden by default and only accessible
- [ ] when in the edit mode, and start position is selected, highlight it and bring it on the top and make other steps opac.
- [ ] get inspiration how to visualize the anchor step and counting steps and foot from [here](https://www.countrydancingtonight.com/wp-content/uploads/2023/01/wcs_cheetsheet-1-898x1024.png)

### editor specific
- [ ] make it possible to edit the footwork for both leader and follower at the same time
- [ ] for the footworks that are mirror of each other make it possible to adopt it from the existing follower/leader footwork and just mirror it.
- [ ] add an option that allows rotating the view to any angle for easier editing
- [ ] add a snapping feature that would allow positioning steps easier
- [ ] add a mouse free editing mode, inspired by vim to add/remove/modify steps and navigate around the ui for ultimate-quick edit experience

### configuration files
- [x] keep a separate file for each pattern.
- [x] changes are not saved automatically; use explicit save and warn on navigation with unsaved changes.

## UI and page styles
- [ ] show the right side panel that is mostly for editing in the editor mode only
- [ ] under the numbers and foot labels L/R also articulate whether it is a step or a triple step. For triple step have it like this, 3: tri, &:ple, 4: step. Also, to make it even more, bundle steps and triple steps by drawing a highlighting contour around the step buttons on the top. Let this be activate by a checkbox options saying: "Read steps".
- [x] mark the role on top of leader/follower toggle button
- [x] use "pattern" terminology throughout the UI and code
- [ ] add keyboard shortcuts that would make it easier to:
    - [ ] insert steps (w for one step and ww for triple steps)
    - [ ] rotate step (r)
    - [ ] opening the ui guide/help (g)
    - [ ] opening the display options (d)
    - [ ] play/pause (i)
    - [ ] previous or next (h for prev and l for next)
    - [ ] add patter (a)



## miscellenous
- [ ] add an option to walk through the user through the interface step by step
- [ ] include a textual quick help text
- [ ] links for about, contact, etc.
- [ ] read the notes per step (text to audio) with proper timing.

