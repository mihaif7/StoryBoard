const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Story = mongoose.model('stories');
const User = mongoose.model('users');
const {
    ensureAuthenticated,
    ensureGuest
} = require('../helpers/auth');


// Stories Index
router.get('/', (req, res) => {
    Story.find({
            status: 'public'
        })
        .populate('user')
        .sort({
            date: 'desc'
        })
        .then(stories => {
            res.render('stories/index', {
                stories: stories
            });
        });
});

// Add Stories
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('stories/add');
});

// Edit Stories
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Story.findOne({
            _id: req.params.id
        })
        .then(story => {
            if (story.user != req.user.id) {
                res.redirect('/stories');
            } else {
                res.render('stories/edit', {
                    story: story
                })
            }
        })
});

// Delete story
router.delete('/:id', ensureAuthenticated, (req, res) => {
    Story.deleteOne({
            _id: req.params.id
        })
        .then(() => {
            res.redirect('/dashboard');
        })
})

// Edit Form Process
router.put('/:id', ensureAuthenticated, (req, res) => {
    Story.findOne({
            _id: req.params.id
        })
        .then(story => {
            let allowComments;

            if (req.body.allowComments) {
                allowComments = true;
            } else {
                allowComments = false;
            }

            // New Values
            story.title = req.body.title;
            story.body = req.body.body;
            story.status = req.body.status;
            story.allowComments = allowComments;

            story.save().then(story => {
                res.redirect('/dashboard');
            })
        })
})


// Process Add Story
router.post('/', ensureAuthenticated, (req, res) => {
    let allowComments;

    if (req.body.allowComments) {
        allowComments = true;
    } else {
        allowComments = false;
    }

    const newStory = {
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        allowComments: allowComments,
        user: req.user.id
    }

    new Story(newStory)
        .save()
        .then(story => {
            res.redirect(`/stories/show/${story.id}`);
        })
})

// List stories from a user
router.get('/user/:userId', (req, res) => {
    Story.find({
            user: req.params.userId,
            status: 'public'
        })
        .populate('user')
        .then(stories => {
            res.render('stories/index', {
                stories: stories
            })
        })
});

// Show single story
router.get('/show/:id', (req, res) => {
    Story.findOne({
            _id: req.params.id
        })
        .populate('user')
        .populate('comments.commentUser')
        .then(story => {
            if (story.status == 'public') {
                res.render('stories/show', {
                    story: story
                })
            } else {
                if (req.user) {
                    if (req.user.id == story.user._id) {
                        res.render('stories/show', {
                            story: story
                        })
                    }
                } else {
                    res.redirect('/404');
                }
            }
        })
});

// Show my stories
router.get('/mystories', (req, res) => {
    Story.find({
            user: req.user.id
        })
        .populate('user')
        .then(stories => {
            res.render('stories/index', {
                stories: stories
            })
        })
});

// Get comment
router.post('/comment/:id', (req, res) => {
    Story.findOne({
            _id: req.params.id
        })
        .then(story => {
            const newComment = {
                commentBody: req.body.commentBody,
                commentUser: req.user.id
            }

            // Puss to comments array
            story.comments.unshift(newComment);

            story.save()
                .then(story => {
                    res.redirect(`/stories/show/${story.id}`)
                })
        })
})

module.exports = router;