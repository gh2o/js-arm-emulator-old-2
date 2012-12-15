FLAGS =
FLAGS += --compilation_level ADVANCED_OPTIMIZATIONS
FLAGS += --formatting PRETTY_PRINT
FLAGS += --summary_detail_level 3

INPUTS = $(sort $(wildcard src/[0-9][0-9]-*.js))
OUTPUTS = test.js

all: $(OUTPUTS)

clean:
	rm -f $(OUTPUTS)

%.js: $(INPUTS) src/%.js
	closure $(FLAGS) --js_output_file $@ $(foreach x,$^,--js $(x)) || rm -f $@
